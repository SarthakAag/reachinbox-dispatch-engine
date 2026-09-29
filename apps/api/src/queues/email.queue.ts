import { Queue } from "bullmq";
import redis from "../lib/redis.js";

export const EMAIL_QUEUE_NAME = "email-dispatch";

export interface EmailJobData {
  emailId: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  sequence: number;

  /*
   * If present, this job has already been assigned
   * a minimum-delay execution time.
   */
  notBefore?: number;
}

export const emailQueue = new Queue<EmailJobData>(
  EMAIL_QUEUE_NAME,
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      removeOnComplete: {
        age: 60 * 60 * 24,
        count: 10000,
      },
      removeOnFail: {
        age: 60 * 60 * 24 * 7,
      },
    },
  },
);
