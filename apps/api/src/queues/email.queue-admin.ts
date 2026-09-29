import { Queue } from "bullmq";
import redis from "../lib/redis.js";
import { EMAIL_QUEUE_NAME } from "./email.queue.js";

const queue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redis,
});

async function main() {
  console.log("Cleaning development email queue...");

  await queue.pause();

  await queue.obliterate({
    force: true,
  });

  await queue.close();
  await redis.quit();

  console.log("Email queue cleaned successfully.");
}

main().catch((error) => {
  console.error("Queue cleanup failed:", error);
  process.exit(1);
});
