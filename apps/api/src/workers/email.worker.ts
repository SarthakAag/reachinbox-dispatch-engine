import {
  DelayedError,
  Worker,
} from "bullmq";

import redis from "../lib/redis.js";

import {
  EMAIL_QUEUE_NAME,
  type EmailJobData,
} from "../queues/email.queue.js";

import {
  claimEmail,
  createDeliveryAttempt,
  markEmailFailed,
  markEmailSending,
  markEmailSent,
  recordDeliveryAttempt,
} from "../services/email/email.service.js";

import {
  reserveSenderSlot,
} from "../services/rate-limit/rate-limit.service.js";

import {
  reserveSendDelay,
} from "../services/rate-limit/send-delay.service.js";

import {
  rescheduleRateLimitedEmail,
} from "../services/scheduler/job-rescheduler.service.js";

import {
  markCampaignRunning,
  markCampaignCompletedIfFinished,
} from "../services/campaign/campaign-status.service.js";

import {
  sendEtherealEmail,
} from "../integrations/email/ethereal.service.js";

import {
  syncEmailToSearch,
} from "../integrations/elasticsearch/email-sync.service.js";

import {
  notifySenderHourlyLimit,
} from "../integrations/slack/slack-notification.service.js";

import { prisma } from "../lib/prisma.js";

const concurrency = Number(
  process.env.WORKER_CONCURRENCY ?? 5,
);

export const emailWorker =
  new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,

    async (job) => {
      /*
       * --------------------------------------------------
       * STEP 0
       * Atomically claim the email.
       * --------------------------------------------------
       *
       * This prevents multiple workers from sending
       * the same email simultaneously.
       *
       * IMPORTANT:
       * claimEmail() does NOT increment attemptCount.
       *
       * attemptCount is incremented only immediately
       * before an actual SMTP delivery attempt.
       */

      const email =
        await claimEmail(
          job.data.emailId,
        );

      if (!email) {
        console.log(
          `[worker] Skipping ${job.data.emailId}: already claimed or processed`,
        );

        return {
          skipped: true,
          reason: "already-claimed",
        };
      }

      /*
       * --------------------------------------------------
       * CAMPAIGN STATE
       * SCHEDULED → RUNNING
       * --------------------------------------------------
       *
       * Only the first successfully claimed email
       * transitions the campaign to RUNNING.
       */

      const campaignStarted =
        await markCampaignRunning(
          email.campaignId,
        );

      if (campaignStarted) {
        console.log(
          `[worker] Campaign ${email.campaignId} is now RUNNING`,
        );
      }

      await syncEmailToSearch(
        email.id,
      );

      /*
       * --------------------------------------------------
       * Load campaign
       * --------------------------------------------------
       */

      const campaign =
        await prisma.campaign.findUnique({
          where: {
            id: email.campaignId,
          },
        });

      if (!campaign) {
        throw new Error(
          `Campaign ${email.campaignId} not found`,
        );
      }

      /*
       * --------------------------------------------------
       * Load sender
       * --------------------------------------------------
       */

      const sender =
        await prisma.sender.findUnique({
          where: {
            id: email.senderId,
          },
        });

      if (!sender) {
        throw new Error(
          `Sender ${email.senderId} not found`,
        );
      }

      /*
       * ==================================================
       * STEP 1
       * MINIMUM SEND DELAY
       * ==================================================
       *
       * If this job already has a notBefore timestamp,
       * it means the minimum-delay slot was already
       * reserved.
       *
       * IMPORTANT:
       * We must NOT reserve another delay slot.
       */

      if (job.data.notBefore) {
        const remaining =
          job.data.notBefore -
          Date.now();

        if (remaining > 0) {
          await prisma.email.update({
            where: {
              id: email.id,
            },

            data: {
              status: "SCHEDULED",

              scheduledAt:
                new Date(
                  job.data.notBefore,
                ),
            },
          });

          await syncEmailToSearch(
            email.id,
          );

          await rescheduleRateLimitedEmail(
            job,
            job.data.notBefore,
          );

          console.log(
            `[worker] Job ${job.id} is still waiting for its assigned delay slot.`,
          );

          /*
           * moveToDelayed() already moved the job
           * out of the active state.
           *
           * DelayedError tells BullMQ that this
           * was intentional.
           */

          throw new DelayedError();
        }

        /*
         * The assigned notBefore timestamp has arrived.
         *
         * Continue to hourly rate-limit checking.
         */
      } else {
        /*
         * ------------------------------------------------
         * First execution of this job.
         * ------------------------------------------------
         *
         * Reserve the sender's minimum-delay slot.
         */

        const sendAt =
          await reserveSendDelay(
            email.senderId,
            campaign.delayBetweenEmailsMs,
          );

        const delayUntilSend =
          sendAt - Date.now();

        if (delayUntilSend > 0) {
          await prisma.email.update({
            where: {
              id: email.id,
            },

            data: {
              status: "SCHEDULED",

              scheduledAt:
                new Date(sendAt),
            },
          });

          await syncEmailToSearch(
            email.id,
          );

          /*
           * Persist the assigned execution
           * timestamp inside the BullMQ job.
           */

          await job.updateData({
            ...job.data,
            notBefore: sendAt,
          });

          await rescheduleRateLimitedEmail(
            job,
            sendAt,
          );

          console.log(
            `[worker] Minimum delay applied to ${email.id}. ` +
              `Rescheduled for ${new Date(
                sendAt,
              ).toISOString()}`,
          );

          /*
           * The job has already been moved
           * to the delayed state.
           */

          throw new DelayedError();
        }
      }

      /*
       * ==================================================
       * STEP 2
       * HOURLY SENDER RATE LIMIT
       * ==================================================
       */

      const reservation =
        await reserveSenderSlot(
          email.senderId,
          campaign.hourlyLimit,
        );

      if (!reservation.allowed) {
        /*
         * Persist the next available dispatch time.
         */

        await prisma.email.update({
          where: {
            id: email.id,
          },

          data: {
            status: "SCHEDULED",

            scheduledAt:
              new Date(
                reservation.retryAt,
              ),
          },
        });

        await syncEmailToSearch(
          email.id,
        );

        /*
         * The previous minimum-delay reservation
         * is no longer useful because this email
         * has to wait for the next hour.
         *
         * Clear notBefore so the email receives a
         * fresh minimum-delay reservation after the
         * hourly window opens.
         */

        await job.updateData({
          ...job.data,
          notBefore: undefined,
        });

        /*
         * ------------------------------------------------
         * Slack notification
         * ------------------------------------------------
         *
         * This executes at the exact point where the
         * sender's hourly rate limit is reached.
         *
         * Redis SET NX ensures concurrent workers
         * only send one notification for the same
         * sender/hour.
         *
         * Slack failure does not prevent rescheduling.
         */

        const slackResult =
          await notifySenderHourlyLimit({
            senderId:
              email.senderId,

            hourlyLimit:
              campaign.hourlyLimit,

            retryAt:
              reservation.retryAt,
          });

        if (
          slackResult.notified
        ) {
          console.log(
            `[worker] Slack notified for sender ${email.senderId}`,
          );
        } else if (
          slackResult.reason ===
          "already-notified"
        ) {
          console.log(
            `[worker] Slack notification already sent for sender ${email.senderId}`,
          );
        } else if (
          slackResult.reason ===
          "not-connected"
        ) {
          console.log(
            `[worker] No Slack connection for sender ${email.senderId}`,
          );
        } else if (
          slackResult.reason ===
          "failed"
        ) {
          console.error(
            `[worker] Slack notification failed for sender ${email.senderId}`,
          );
        }

        /*
         * ------------------------------------------------
         * Reschedule
         * ------------------------------------------------
         */

        await rescheduleRateLimitedEmail(
          job,
          reservation.retryAt,
        );

        console.log(
          `[worker] Hourly limit reached for sender ${email.senderId}`,
        );

        console.log(
          `[worker] ${email.id} rescheduled for ${new Date(
            reservation.retryAt,
          ).toISOString()}`,
        );

        /*
         * The job has already been moved to
         * BullMQ's delayed state.
         */

        throw new DelayedError();
      }

      /*
       * ==================================================
       * STEP 3
       * MARK AS SENDING
       * ==================================================
       */

      await markEmailSending(
        email.id,
      );

      await syncEmailToSearch(
        email.id,
      );

      /*
       * ==================================================
       * STEP 3.1
       * RECORD ACTUAL SMTP ATTEMPT
       * ==================================================
       *
       * IMPORTANT:
       *
       * This happens only after:
       *
       * 1. Email has been claimed
       * 2. Minimum delay has been satisfied
       * 3. Hourly rate limit has been satisfied
       *
       * Therefore rate-limit/minimum-delay reschedules
       * do NOT increase attemptCount.
       */

      const updatedEmail =
        await recordDeliveryAttempt(
          email.id,
        );

      const attemptNumber =
        updatedEmail.attemptCount;

      await createDeliveryAttempt(
        email.id,
        attemptNumber,
        "PENDING",
      );

      /*
       * ==================================================
       * STEP 4
       * ETHEREAL SMTP
       * ==================================================
       */

      try {
        const result =
          await sendEtherealEmail({
            from: sender.email,
            to: email.recipient,
            subject: email.subject,
            text: email.body,
          });

        /*
         * Mark delivery attempt successful.
         */

        await prisma.deliveryAttempt.update({
          where: {
            emailId_attemptNumber: {
              emailId: email.id,
              attemptNumber,
            },
          },

          data: {
            status: "SUCCESS",

            providerId:
              result.messageId,
          },
        });

        /*
         * Mark email SENT.
         */

        await markEmailSent(
          email.id,
          result.messageId,
        );

        /*
         * Check whether this was the final
         * email in the campaign.
         */

        const campaignCompleted =
          await markCampaignCompletedIfFinished(
            email.campaignId,
          );

        if (campaignCompleted) {
          console.log(
            `[worker] Campaign ${email.campaignId} completed`,
          );
        }

        /*
         * Update Elasticsearch.
         */

        await syncEmailToSearch(
          email.id,
        );

        console.log(
          `[worker] SENT ${email.recipient}`,
        );

        if (result.previewUrl) {
          console.log(
            `[worker] Ethereal preview: ${result.previewUrl}`,
          );
        }

        return {
          emailId: email.id,
          status: "sent",
          messageId:
            result.messageId,
          previewUrl:
            result.previewUrl,
        };
      } catch (error) {
        /*
         * ------------------------------------------------
         * SMTP FAILURE
         * ------------------------------------------------
         */

        const message =
          error instanceof Error
            ? error.message
            : "Unknown SMTP error";

        /*
         * Always record the individual delivery
         * attempt as failed.
         */

        await prisma.deliveryAttempt.update({
          where: {
            emailId_attemptNumber: {
              emailId: email.id,
              attemptNumber,
            },
          },

          data: {
            status: "FAILED",
            errorMessage: message,
          },
        });

        /*
         * BullMQ's attempts option controls the
         * total number of executions.
         *
         * attemptsMade is zero-based, so the current
         * execution is attemptsMade + 1.
         */

        const maxAttempts =
          job.opts.attempts ?? 1;

        const currentAttempt =
          job.attemptsMade + 1;

        const isFinalAttempt =
          currentAttempt >=
          maxAttempts;

        if (isFinalAttempt) {
          /*
           * No more BullMQ retries remain.
           *
           * Permanently mark the email as FAILED.
           */

          await prisma.email.update({
            where: {
              id: email.id,
            },

            data: {
              status: "FAILED",
              lastError: message,
            },
          });

          console.error(
            `[worker] Final SMTP attempt failed for ${email.id}. ` +
              `Attempt ${currentAttempt}/${maxAttempts}.`,
          );
        } else {
          /*
           * BullMQ will retry this job.
           *
           * RETRY_PENDING allows claimEmail()
           * to atomically claim the next attempt.
           */

          await markEmailFailed(
            email.id,
            message,
          );

          console.warn(
            `[worker] SMTP attempt failed for ${email.id}. ` +
              `Attempt ${currentAttempt}/${maxAttempts}. ` +
              `Email marked RETRY_PENDING.`,
          );
        }

        await syncEmailToSearch(
          email.id,
        );

        /*
         * Throwing the original error allows BullMQ
         * to execute its configured retry strategy.
         */

        throw error;
      }
    },

    {
      connection: redis,
      concurrency,
    },
  );

/*
 * ======================================================
 * WORKER EVENTS
 * ======================================================
 */

emailWorker.on(
  "completed",
  (job) => {
    console.log(
      `[worker] Completed job ${job.id}`,
    );
  },
);

emailWorker.on(
  "failed",
  (job, error) => {
    /*
     * DelayedError is an intentional control-flow
     * signal, so don't treat it as a real failure.
     */

    if (
      error instanceof DelayedError
    ) {
      return;
    }

    console.error(
      `[worker] Failed job ${job?.id}:`,
      error.message,
    );
  },
);

console.log(
  `Email worker started with concurrency=${concurrency}`,
);