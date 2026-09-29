import type {
  Request,
  Response,
} from "express";

import {
  searchEmails,
} from "../services/search/email-search.service.js";

export async function searchEmailsController(
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

    const query =
      typeof req.query.q === "string"
        ? req.query.q
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const campaignId =
      typeof req.query.campaignId === "string"
        ? req.query.campaignId
        : undefined;

    const senderId =
      typeof req.query.senderId === "string"
        ? req.query.senderId
        : undefined;

    const pageValue =
      typeof req.query.page === "string"
        ? Number(req.query.page)
        : 1;

    const limitValue =
      typeof req.query.limit === "string"
        ? Number(req.query.limit)
        : 20;

    const page =
      Number.isInteger(pageValue) &&
      pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(limitValue) &&
      limitValue > 0 &&
      limitValue <= 100
        ? limitValue
        : 20;

    const result =
      await searchEmails({
        userId,
        query,
        status,
        campaignId,
        senderId,
        page,
        limit,
      });

    return res.json(result);
  } catch (error) {
    console.error(
      "Email search error:",
      error,
    );

    return res.status(500).json({
      error: "Failed to search emails",
    });
  }
}
