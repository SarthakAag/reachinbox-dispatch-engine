import type { Job } from "bullmq";
import { prisma } from "../../lib/prisma.js";
import type { EmailJobData } from "../../queues/email.queue.js";

export async function rescheduleRateLimitedEmail(
  job: Job<EmailJobData>,
  retryAt: number,
) {
  const delay = Math.max(
    1000,
    retryAt - Date.now(),
  );

  await prisma.email.update({
    where: {
      id: job.data.emailId,
    },
    data: {
      status: "SCHEDULED",
      scheduledAt: new Date(retryAt),
    },
  });

  await job.moveToDelayed(
    Date.now() + delay,
    job.token,
  );

  return {
    emailId: job.data.emailId,
    retryAt,
    delay,
  };
}
