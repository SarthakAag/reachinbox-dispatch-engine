import { prisma } from "../../lib/prisma.js";
import { emailQueue } from "../../queues/email.queue.js";
import { scheduleCampaign } from "../scheduler/scheduler.service.js";

export async function markCampaignRunning(
  campaignId: string,
): Promise<boolean> {
  const result = await prisma.campaign.updateMany({
    where: {
      id: campaignId,
      status: "SCHEDULED",
    },
    data: {
      status: "RUNNING",
    },
  });

  return result.count === 1;
}

export async function markCampaignCompletedIfFinished(
  campaignId: string,
): Promise<boolean> {
  const remainingEmails = await prisma.email.count({
    where: {
      campaignId,
      status: {
        not: "SENT",
      },
    },
  });

  if (remainingEmails !== 0) {
    return false;
  }

  const result = await prisma.campaign.updateMany({
    where: {
      id: campaignId,
      status: {
        in: ["SCHEDULED", "RUNNING"],
      },
    },
    data: {
      status: "COMPLETED",
    },
  });

  return result.count === 1;
}

export async function pauseCampaign(
  campaignId: string,
  userId: string,
): Promise<boolean> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId,
      status: {
        in: ["SCHEDULED", "RUNNING"],
      },
    },
    include: {
      emails: {
        where: {
          status: {
            in: ["SCHEDULED", "QUEUED", "RETRY_PENDING"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!campaign) {
    return false;
  }

  for (const email of campaign.emails) {
    const job = await emailQueue.getJob(email.id);

    if (job) {
      const state = await job.getState();

      if (
        state === "delayed" ||
        state === "waiting" ||
        state === "prioritized"
      ) {
        await job.remove();
      }
    }
  }

  await prisma.$transaction([
    prisma.email.updateMany({
      where: {
        campaignId,
        status: {
          in: ["SCHEDULED", "QUEUED", "RETRY_PENDING"],
        },
      },
      data: {
        status: "SCHEDULED",
      },
    }),

    prisma.campaign.updateMany({
      where: {
        id: campaignId,
        userId,
        status: {
          in: ["SCHEDULED", "RUNNING"],
        },
      },
      data: {
        status: "PAUSED",
      },
    }),
  ]);

  return true;
}

export async function resumeCampaign(
  campaignId: string,
  userId: string,
): Promise<boolean> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId,
      status: "PAUSED",
    },
    include: {
      emails: {
        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

  if (!campaign) {
    return false;
  }

  await scheduleCampaign({
    campaignId,
    startTime: new Date(),
    delayBetweenEmailsMs: campaign.delayBetweenEmailsMs,
  });

  await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      status: "RUNNING",
    },
  });

  return true;
}

export async function cancelCampaign(
  campaignId: string,
  userId: string,
): Promise<boolean> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId,
      status: {
        in: ["DRAFT", "SCHEDULED", "RUNNING", "PAUSED"],
      },
    },
    include: {
      emails: {
        where: {
          status: {
            in: ["SCHEDULED", "QUEUED", "RETRY_PENDING"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!campaign) {
    return false;
  }

  for (const email of campaign.emails) {
    const job = await emailQueue.getJob(email.id);

    if (job) {
      const state = await job.getState();

      if (
        state === "delayed" ||
        state === "waiting" ||
        state === "prioritized"
      ) {
        await job.remove();
      }
    }
  }

  await prisma.$transaction([
    prisma.email.updateMany({
      where: {
        campaignId,
        status: {
          in: ["SCHEDULED", "QUEUED", "RETRY_PENDING"],
        },
      },
      data: {
        status: "FAILED",
        lastError: "Campaign cancelled by user",
      },
    }),

    prisma.campaign.updateMany({
      where: {
        id: campaignId,
        userId,
        status: {
          in: ["DRAFT", "SCHEDULED", "RUNNING", "PAUSED"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    }),
  ]);

  return true;
}
