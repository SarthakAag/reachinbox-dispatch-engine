import { WebClient } from "@slack/web-api";

import redis from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";

const NOTIFICATION_LOCK_TTL_SECONDS =
  60 * 60 * 2;

export interface HourlyLimitNotificationInput {
  senderId: string;
  hourlyLimit: number;
  retryAt: number;
}

interface SlackNotificationResult {
  notified: boolean;
  reason:
    | "sent"
    | "already-notified"
    | "not-connected"
    | "failed";
}

const NOTIFICATION_LOCK_SCRIPT = `
local key = KEYS[1]
local ttl = tonumber(ARGV[1])

local created = redis.call(
  "SET",
  key,
  "1",
  "NX",
  "EX",
  ttl
)

if created then
  return 1
end

return 0
`;

const RELEASE_NOTIFICATION_LOCK_SCRIPT = `
local key = KEYS[1]

if redis.call("GET", key) == "1" then
  return redis.call("DEL", key)
end

return 0
`;

function getNotificationLockKey(
  senderId: string,
  retryAt: number,
) {
  const sourceHour =
    Math.floor(
      (retryAt - 1) / 3_600_000,
    );

  return (
    `slack-rate-limit-notification:` +
    `sender:${senderId}:hour:${sourceHour}`
  );
}

async function acquireNotificationLock(
  senderId: string,
  retryAt: number,
): Promise<{
  acquired: boolean;
  key: string;
}> {
  const key = getNotificationLockKey(
    senderId,
    retryAt,
  );

  const result = await redis.eval(
    NOTIFICATION_LOCK_SCRIPT,
    1,
    key,
    NOTIFICATION_LOCK_TTL_SECONDS,
  );

  return {
    acquired: Number(result) === 1,
    key,
  };
}

async function releaseNotificationLock(
  key: string,
) {
  await redis.eval(
    RELEASE_NOTIFICATION_LOCK_SCRIPT,
    1,
    key,
  );
}

export async function notifySenderHourlyLimit(
  input: HourlyLimitNotificationInput,
): Promise<SlackNotificationResult> {
  const {
    senderId,
    hourlyLimit,
    retryAt,
  } = input;

  const sender =
    await prisma.sender.findUnique({
      where: {
        id: senderId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        userId: true,
      },
    });

  if (!sender) {
    console.error(
      `[slack] Sender ${senderId} not found`,
    );

    return {
      notified: false,
      reason: "failed",
    };
  }

  const connection =
    await prisma.slackConnection.findUnique({
      where: {
        userId: sender.userId,
      },
      select: {
        accessToken: true,
        channelId: true,
        teamName: true,
      },
    });

  if (!connection) {
    return {
      notified: false,
      reason: "not-connected",
    };
  }

  /*
   * Distributed deduplication:
   *
   * If multiple workers discover the rate
   * limit simultaneously, only one worker
   * can acquire the Redis lock.
   */
  const lock =
    await acquireNotificationLock(
      senderId,
      retryAt,
    );

  if (!lock.acquired) {
    return {
      notified: false,
      reason: "already-notified",
    };
  }

  try {
    const slack =
      new WebClient(
        connection.accessToken,
      );

    const retryDate =
      new Date(retryAt);

    const senderLabel =
      sender.displayName
        ? `${sender.displayName} <${sender.email}>`
        : sender.email;

    await slack.chat.postMessage({
      channel:
        connection.channelId,

      text:
        `ReachInbox hourly dispatch limit reached for ${senderLabel}.`,

      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text:
              "Hourly dispatch limit reached",
          },
        },

        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text:
                `*Sender*\n${senderLabel}`,
            },
            {
              type: "mrkdwn",
              text:
                `*Hourly limit*\n${hourlyLimit} emails`,
            },
            {
              type: "mrkdwn",
              text:
                `*Workspace*\n${connection.teamName}`,
            },
            {
              type: "mrkdwn",
              text:
                `*Next window*\n${retryDate.toLocaleString()}`,
            },
          ],
        },

        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "The remaining scheduled emails have been automatically rescheduled into the next available hourly dispatch window.",
          },
        },

        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text:
                "ReachInbox Dispatch Engine • Rate-limit protection",
            },
          ],
        },
      ],
    });

    console.log(
      `[slack] Hourly limit notification sent for ${sender.email}`,
    );

    return {
      notified: true,
      reason: "sent",
    };
  } catch (error) {
    /*
     * The Slack API failed after we acquired the
     * distributed lock. Release it so a later
     * worker can retry the notification.
     */
    try {
      await releaseNotificationLock(
        lock.key,
      );
    } catch (releaseError) {
      console.error(
        "[slack] Failed to release notification lock:",
        releaseError,
      );
    }

    console.error(
      `[slack] Failed to send hourly limit notification for ${sender.email}:`,
      error,
    );

    return {
      notified: false,
      reason: "failed",
    };
  }
}
