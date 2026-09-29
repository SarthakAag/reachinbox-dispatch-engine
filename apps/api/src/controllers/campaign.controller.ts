import type { Request, Response } from "express";
import {
  createCampaign,
  getUserCampaigns,
} from "../services/campaign/campaign.service.js";
import {
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
} from "../services/campaign/campaign-status.service.js";

export async function createCampaignController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const {
      senderId,
      subject,
      body,
      recipients,
      startTime,
      delayBetweenEmailsMs,
      hourlyLimit,
    } = req.body;

    if (
      !senderId ||
      !subject ||
      !body ||
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      !startTime
    ) {
      return res.status(400).json({
        error: "Missing required campaign fields",
      });
    }

    const parsedStartTime = new Date(startTime);

    if (Number.isNaN(parsedStartTime.getTime())) {
      return res.status(400).json({
        error: "Invalid campaign start time",
      });
    }

    const campaign = await createCampaign({
      userId,
      senderId,
      subject,
      body,
      recipients,
      startTime: parsedStartTime,
      delayBetweenEmailsMs: Number(
        delayBetweenEmailsMs ?? 2000,
      ),
      hourlyLimit: Number(
        hourlyLimit ?? 100,
      ),
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error(
      "Create campaign error:",
      error,
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create campaign",
    });
  }
}

export async function pauseCampaignController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const success = await pauseCampaign(
      String(req.params.id),
      userId,
    );

    if (!success) {
      return res.status(404).json({
        error:
          "Campaign not found or cannot be paused",
      });
    }

    return res.json({
      message: "Campaign paused successfully",
    });
  } catch (error) {
    console.error("Pause campaign error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to pause campaign",
    });
  }
}

export async function resumeCampaignController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const success = await resumeCampaign(
      String(req.params.id),
      userId,
    );

    if (!success) {
      return res.status(404).json({
        error:
          "Campaign not found or cannot be resumed",
      });
    }

    return res.json({
      message: "Campaign resumed successfully",
    });
  } catch (error) {
    console.error("Resume campaign error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to resume campaign",
    });
  }
}

export async function cancelCampaignController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const success = await cancelCampaign(
      String(req.params.id),
      userId,
    );

    if (!success) {
      return res.status(404).json({
        error:
          "Campaign not found or cannot be cancelled",
      });
    }

    return res.json({
      message: "Campaign cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel campaign error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel campaign",
    });
  }
}

export async function getCampaignsController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const campaigns = await getUserCampaigns(userId);

    return res.json({
      campaigns,
    });
  } catch (error) {
    console.error("Get campaigns error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to load campaigns",
    });
  }
}
