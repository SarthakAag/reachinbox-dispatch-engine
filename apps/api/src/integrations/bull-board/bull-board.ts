import { ExpressAdapter } from "@bull-board/express";
import {
  BullMQAdapter,
} from "@bull-board/api/bullMQAdapter";

import { createBullBoard } from "@bull-board/api";

import { emailQueue } from "../../queues/email.queue.js";

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
  ],
  serverAdapter,
});

export { serverAdapter };