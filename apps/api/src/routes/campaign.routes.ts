import { Router } from "express";

import {
  createCampaignController,
  getCampaignsController,
  pauseCampaignController,
  resumeCampaignController,
  cancelCampaignController,
} from "../controllers/campaign.controller.js";

import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getCampaignsController,
);

router.post(
  "/",
  requireAuth,
  createCampaignController,
);

router.post(
  "/:id/pause",
  requireAuth,
  pauseCampaignController,
);

router.post(
  "/:id/resume",
  requireAuth,
  resumeCampaignController,
);

router.post(
  "/:id/cancel",
  requireAuth,
  cancelCampaignController,
);

export default router;
