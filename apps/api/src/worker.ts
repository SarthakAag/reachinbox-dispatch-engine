import "./config/env.js";

import { emailWorker } from "./workers/email.worker.js";
import redis from "./lib/redis.js";

console.log("ReachInbox email worker is running");

async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}. Shutting down...`);

  try {
    await emailWorker.close();
    await redis.quit();

    console.log("[worker] Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("[worker] Shutdown error:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  console.error("[worker] Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[worker] Unhandled rejection:", reason);
});
