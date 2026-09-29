import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";

export async function emailStatsController(
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

    const userCampaignFilter = {
      campaign: {
        userId,
      },
    };

    const [
      scheduled,
      queued,
      processing,
      sending,
      sent,
      failed,
      retryPending,
    ] = await Promise.all([
      prisma.email.count({
        where: {
          status: "SCHEDULED",
          ...userCampaignFilter,
        },
      }),
      prisma.email.count({
        where: {
          status: "QUEUED",
          ...userCampaignFilter,
        },
      }),
      prisma.email.count({
        where: {
          status: "PROCESSING",
          ...userCampaignFilter,
        },
      }),
      prisma.email.count({
        where: {
          status: "SENDING",
          ...userCampaignFilter,
        },
      }),
      prisma.email.count({
        where: {
          status: "SENT",
          ...userCampaignFilter,
        },
      }),
      prisma.email.count({
        where: {
          status: "FAILED",
          ...userCampaignFilter,
        },
      }),
      prisma.email.count({
        where: {
          status: "RETRY_PENDING",
          ...userCampaignFilter,
        },
      }),
    ]);

    return res.json({
      scheduled,
      queued,
      processing,
      sending,
      sent,
      failed,
      retryPending,
      active: queued + processing + sending,
    });
  } catch (error) {
    console.error(
      "[email-stats] Failed to load email statistics:",
      error,
    );

    return res.status(500).json({
      error: "Failed to load email statistics",
    });
  }
}
