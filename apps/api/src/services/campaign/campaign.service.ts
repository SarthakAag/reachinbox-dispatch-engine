import { prisma } from "../../lib/prisma.js";
import { scheduleCampaign } from "../scheduler/scheduler.service.js";

export interface CreateCampaignInput {
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}

export async function createCampaign(
  input: CreateCampaignInput,
) {
  if (input.recipients.length === 0) {
    throw new Error("At least one recipient is required");
  }

  if (input.delayBetweenEmailsMs < 0) {
    throw new Error("Delay cannot be negative");
  }

  if (input.hourlyLimit <= 0) {
    throw new Error(
      "Hourly limit must be greater than zero",
    );
  }

  const cleanedRecipients = input.recipients
    .map((recipient) => recipient.trim().toLowerCase())
    .filter(Boolean);

  if (cleanedRecipients.length === 0) {
    throw new Error(
      "At least one valid recipient is required",
    );
  }

  const uniqueRecipients = [
    ...new Set(cleanedRecipients),
  ];

  const sender = await prisma.sender.findFirst({
    where: {
      id: input.senderId,
      userId: input.userId,
    },
  });

  if (!sender) {
    throw new Error("Sender not found");
  }

  const campaign = await prisma.$transaction(
    async (tx) => {
      const createdCampaign = await tx.campaign.create({
        data: {
          userId: input.userId,
          senderId: input.senderId,
          subject: input.subject,
          body: input.body,
          startTime: input.startTime,
          delayBetweenEmailsMs:
            input.delayBetweenEmailsMs,
          hourlyLimit: input.hourlyLimit,
          status: "DRAFT",
        },
      });

      await tx.email.createMany({
        data: uniqueRecipients.map(
          (recipient, index) => ({
            campaignId: createdCampaign.id,
            senderId: input.senderId,
            recipient,
            subject: input.subject,
            body: input.body,
            scheduledAt: input.startTime,
            sequence: index,
            idempotencyKey:
              `${createdCampaign.id}:${index}:${recipient}`,
            status: "SCHEDULED",
          }),
        ),
      });

      return createdCampaign;
    },
  );

  const scheduled = await scheduleCampaign({
    campaignId: campaign.id,
    startTime: input.startTime,
    delayBetweenEmailsMs:
      input.delayBetweenEmailsMs,
  });

  /*
   * scheduleCampaign updates the campaign status
   * to SCHEDULED. Re-fetch it so the API response
   * contains the current database state rather than
   * the original DRAFT object.
   */
  const scheduledCampaign =
    await prisma.campaign.findUnique({
      where: {
        id: campaign.id,
      },
      include: {
        emails: {
          orderBy: {
            sequence: "asc",
          },
          select: {
            id: true,
            recipient: true,
            sequence: true,
            scheduledAt: true,
            status: true,
            bullJobId: true,
          },
        },
      },
    });

  if (!scheduledCampaign) {
    throw new Error(
      "Campaign disappeared after scheduling",
    );
  }

  return {
    campaign: scheduledCampaign,
    scheduled,
  };
}
export async function getUserCampaigns(userId: string) {
  return prisma.campaign.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
      _count: {
        select: {
          emails: true,
        },
      },
    },
  });
}
