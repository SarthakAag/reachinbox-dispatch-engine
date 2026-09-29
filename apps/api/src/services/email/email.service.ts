import { prisma } from "../../lib/prisma.js";

export async function claimEmail(emailId: string) {
  const result = await prisma.email.updateMany({
    where: {
      id: emailId,
      status: {
        in: ["QUEUED", "SCHEDULED", "RETRY_PENDING"],
      },
    },
    data: {
      status: "PROCESSING",
    },
  });

  if (result.count !== 1) {
    return null;
  }

  return prisma.email.findUnique({
    where: {
      id: emailId,
    },
  });
}

export async function recordDeliveryAttempt(emailId: string) {
  return prisma.email.update({
    where: {
      id: emailId,
    },
    data: {
      attemptCount: {
        increment: 1,
      },
    },
  });
}

export async function markEmailSending(emailId: string) {
  return prisma.email.update({
    where: {
      id: emailId,
    },
    data: {
      status: "SENDING",
    },
  });
}

export async function markEmailSent(
  emailId: string,
  messageId: string,
) {
  return prisma.email.update({
    where: {
      id: emailId,
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
      messageId,
      lastError: null,
    },
  });
}

export async function markEmailFailed(
  emailId: string,
  errorMessage: string,
) {
  return prisma.email.update({
    where: {
      id: emailId,
    },
    data: {
      status: "RETRY_PENDING",
      lastError: errorMessage,
    },
  });
}

export async function createDeliveryAttempt(
  emailId: string,
  attemptNumber: number,
  status: "PENDING" | "SUCCESS" | "FAILED",
  providerId?: string,
  errorMessage?: string,
) {
  return prisma.deliveryAttempt.create({
    data: {
      emailId,
      attemptNumber,
      status,
      providerId,
      errorMessage,
    },
  });
}