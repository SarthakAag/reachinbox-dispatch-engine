import { Router } from "express";
import { WebClient } from "@slack/web-api";

import { prisma } from "../lib/prisma.js";

const router = Router();

const slackClientId =
  process.env.SLACK_CLIENT_ID;

const slackClientSecret =
  process.env.SLACK_CLIENT_SECRET;

const slackRedirectUri =
  process.env.SLACK_REDIRECT_URI ??
  "http://localhost:4000/api/slack/oauth/callback";

const webUrl =
  process.env.WEB_URL ??
  "http://localhost:3000";

function getUserId(req: {
  user?: Express.User;
}) {
  return req.user?.id;
}

/**
 * Start Slack OAuth.
 */
router.get(
  "/oauth/connect",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (
      !slackClientId ||
      !slackClientSecret
    ) {
      return res.status(500).json({
        error:
          "Slack OAuth is not configured",
      });
    }

    const state = Buffer.from(
      JSON.stringify({
        userId,
        timestamp: Date.now(),
      }),
    ).toString("base64url");

    const params = new URLSearchParams({
      client_id: slackClientId,
      redirect_uri: slackRedirectUri,
      state,
      scope:
        "chat:write,channels:read,groups:read",
    });

    return res.redirect(
      `https://slack.com/oauth/v2/authorize?${params.toString()}`,
    );
  },
);

/**
 * Slack OAuth callback.
 */
router.get(
  "/oauth/callback",
  async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    if (
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      return res.status(400).json({
        error:
          "Missing Slack OAuth parameters",
      });
    }

    try {
      const stateData = JSON.parse(
        Buffer.from(
          state,
          "base64url",
        ).toString("utf8"),
      ) as {
        userId: string;
        timestamp: number;
      };

      if (
        !stateData.userId ||
        !stateData.timestamp
      ) {
        return res.status(400).json({
          error: "Invalid OAuth state",
        });
      }

      if (
        Date.now() -
          stateData.timestamp >
        10 * 60 * 1000
      ) {
        return res.status(400).json({
          error: "OAuth state expired",
        });
      }

      const response =
        await fetch(
          "https://slack.com/api/oauth.v2.access",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
            body:
              new URLSearchParams({
                client_id:
                  slackClientId ?? "",
                client_secret:
                  slackClientSecret ?? "",
                code,
                redirect_uri:
                  slackRedirectUri,
              }),
          },
        );

      const data =
        (await response.json()) as {
          ok: boolean;
          error?: string;
          access_token?: string;
          team?: {
            id?: string;
            name?: string;
          };
        };

      if (
        !data.ok ||
        !data.access_token ||
        !data.team?.id
      ) {
        return res.status(400).json({
          error:
            data.error ??
            "Slack OAuth failed",
        });
      }

      const slack = new WebClient(
        data.access_token,
      );

      const channels =
        await slack.conversations.list({
          types:
            "public_channel,private_channel",
          limit: 100,
        });

      const channel =
        channels.channels?.find(
          (item) =>
            Boolean(item.id) &&
            !item.is_archived,
        );

      if (!channel?.id) {
        return res.status(400).json({
          error:
            "No accessible Slack channel found",
        });
      }

      await prisma.slackConnection.upsert({
        where: {
          userId: stateData.userId,
        },
        update: {
          teamId: data.team.id,
          teamName:
            data.team.name ??
            "Slack Workspace",
          accessToken:
            data.access_token,
          channelId: channel.id,
        },
        create: {
          userId: stateData.userId,
          teamId: data.team.id,
          teamName:
            data.team.name ??
            "Slack Workspace",
          accessToken:
            data.access_token,
          channelId: channel.id,
        },
      });

      return res.redirect(
        `${webUrl}/dashboard?slack=connected`,
      );
    } catch (error) {
      console.error(
        "[slack] OAuth callback failed:",
        error,
      );

      return res.status(500).json({
        error:
          "Slack OAuth callback failed",
      });
    }
  },
);

/**
 * Get current Slack connection.
 */
router.get(
  "/connection",
  async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const connection =
      await prisma.slackConnection.findUnique(
        {
          where: {
            userId,
          },
          select: {
            id: true,
            teamId: true,
            teamName: true,
            channelId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      );

    return res.json({
      connected: Boolean(connection),
      connection,
    });
  },
);

/**
 * Disconnect Slack.
 */
router.post(
  "/disconnect",
  async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    await prisma.slackConnection.deleteMany({
      where: {
        userId,
      },
    });

    return res.json({
      success: true,
    });
  },
);

export default router;