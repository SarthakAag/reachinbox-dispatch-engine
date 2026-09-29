import { prisma } from "../../lib/prisma.js";
import { indexEmail } from "./email-index.service.js";

export async function syncEmailToSearch(
  emailId: string,
) {
  const email = await prisma.email.findUnique({
    where: {
      id: emailId,
    },
    include: {
      campaign: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!email) {
    return;
  }

  await indexEmail({
    id: email.id,
    userId: email.campaign.userId,
    campaignId: email.campaignId,
    senderId: email.senderId,
    recipient: email.recipient,
    subject: email.subject,
    body: email.body,
    status: email.status,
    scheduledAt: email.scheduledAt.toISOString(),
    sentAt: email.sentAt?.toISOString() ?? null,
    sequence: email.sequence,
    attemptCount: email.attemptCount,
    messageId: email.messageId,
    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  });
}
