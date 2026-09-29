import { Router } from "express";

import {
  searchEmailsController,
} from "../controllers/email-search.controller.js";

import {
  emailStatsController,
} from "../controllers/email-stats.controller.js";

import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.get(
  "/search",
  requireAuth,
  searchEmailsController,
);

router.get(
  "/stats",
  requireAuth,
  emailStatsController,
);

export default router;
