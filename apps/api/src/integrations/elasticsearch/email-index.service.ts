import {
  EMAIL_INDEX,
  elasticsearch,
} from "./client.js";

export interface EmailSearchDocument {
  id: string;
  userId: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  sequence: number;
  attemptCount: number;
  messageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function ensureEmailIndex() {
  const exists = await elasticsearch.indices.exists({
    index: EMAIL_INDEX,
  });

  if (exists) {
    return;
  }

  await elasticsearch.indices.create({
    index: EMAIL_INDEX,
    mappings: {
      properties: {
        id: {
          type: "keyword",
        },
        userId: {
          type: "keyword",
        },
        campaignId: {
          type: "keyword",
        },
        senderId: {
          type: "keyword",
        },
        recipient: {
          type: "text",
          fields: {
            keyword: {
              type: "keyword",
            },
          },
        },
        subject: {
          type: "text",
        },
        body: {
          type: "text",
        },
        status: {
          type: "keyword",
        },
        scheduledAt: {
          type: "date",
        },
        sentAt: {
          type: "date",
        },
        sequence: {
          type: "integer",
        },
        attemptCount: {
          type: "integer",
        },
        messageId: {
          type: "keyword",
        },
        createdAt: {
          type: "date",
        },
        updatedAt: {
          type: "date",
        },
      },
    },
  });

  console.log(
    `[elasticsearch] Created index ${EMAIL_INDEX}`,
  );
}

export async function indexEmail(
  document: EmailSearchDocument,
) {
  await elasticsearch.index({
    index: EMAIL_INDEX,
    id: document.id,
    document,
    refresh: "wait_for",
  });
}

export async function deleteIndexedEmail(
  emailId: string,
) {
  try {
    await elasticsearch.delete({
      index: EMAIL_INDEX,
      id: emailId,
      refresh: "wait_for",
    });
  } catch (error: unknown) {
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error
        ? error.statusCode
        : undefined;

    if (statusCode !== 404) {
      throw error;
    }
  }
}
