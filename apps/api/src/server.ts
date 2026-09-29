import "./config/env.js";

import app from "./app.js";
import { ensureEmailIndex } from "./integrations/elasticsearch/email-index.service.js";

const PORT = Number(
  process.env.API_PORT ?? 4000,
);

async function startServer() {
  await ensureEmailIndex();

  app.listen(PORT, () => {
    console.log(
      `ReachInbox API running on http://localhost:${PORT}`,
    );
  });
}

startServer().catch((error) => {
  console.error(
    "Failed to start ReachInbox API:",
    error,
  );

  process.exit(1);
});