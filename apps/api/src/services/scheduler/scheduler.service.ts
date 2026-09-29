import { prisma } from "../../lib/prisma.js";
import {
  emailQueue,
  type EmailJobData,
} from "../../queues/email.queue.js";

export interface ScheduleCampaignInput {
  campaignId: string;
  startTime: Date;
  delayBetweenEmailsMs: number;
}

export async function scheduleCampaign({
  campaignId,
  startTime,
  delayBetweenEmailsMs,
}: ScheduleCampaignInput) {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    include: {
      emails: {
        where: {
          status: {
            not: "SENT",
          },
        },
        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

  if (!campaign) {
    throw new Error(
      `Campaign ${campaignId} not found`,
    );
  }

  if (campaign.emails.length === 0) {
    throw new Error(
      `Campaign ${campaignId} has no emails`,
    );
  }

  if (delayBetweenEmailsMs < 0) {
    throw new Error(
      "Delay between emails cannot be negative",
    );
  }

  const now = Date.now();

  let scheduledEmails = 0;

  for (const email of campaign.emails) {
    /*
     * Calculate the deterministic dispatch time
     * from the campaign start time and sequence.
     */
    const scheduledAt =
      startTime.getTime() +
      email.sequence * delayBetweenEmailsMs;

    const delay = Math.max(
      0,
      scheduledAt - now,
    );

    const jobData: EmailJobData = {
      emailId: email.id,
      campaignId: campaign.id,
      senderId: campaign.senderId,
      recipient: email.recipient,
      sequence: email.sequence,
      notBefore: scheduledAt,
    };

    /*
     * --------------------------------------------------
     * IDEMPOTENT BULLMQ SCHEDULING
     * --------------------------------------------------
     *
     * The Email ID is also the BullMQ job ID.
     *
     * This means the same email can safely pass
     * through this scheduler multiple times without
     * creating another BullMQ job.
     */

    let job = await emailQueue.getJob(
      email.id,
    );

    if (!job) {
      job = await emailQueue.add(
        `email-${email.id}`,
        jobData,
        {
          jobId: email.id,
          delay,
        },
      );

      console.log(
        `[scheduler] Created BullMQ job ${job.id} ` +
          `for ${email.recipient}`,
      );
    } else {
      /*
       * The job already exists.
       *
       * Do not create another job.
       */

      console.log(
        `[scheduler] Reusing existing BullMQ job ${job.id} ` +
          `for ${email.recipient}`,
      );
    }

    /*
     * Persist the scheduling information in PostgreSQL.
     *
     * PostgreSQL remains the source of truth for the
     * email's scheduled state.
     */

    await prisma.email.update({
      where: {
        id: email.id,
      },
      data: {
        scheduledAt:
          new Date(scheduledAt),
        status: "QUEUED",
        bullJobId: job.id,
      },
    });

    scheduledEmails += 1;
  }

  /*
   * Mark the campaign as scheduled only after all
   * email jobs have been successfully processed.
   */

  await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      status: "SCHEDULED",
      startTime,
    },
  });

  console.log(
    `[scheduler] Campaign ${campaignId} scheduled ` +
      `with ${scheduledEmails} emails`,
  );

  return {
    campaignId,
    scheduledEmails,
  };
}