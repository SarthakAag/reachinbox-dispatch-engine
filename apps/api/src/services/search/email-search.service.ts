import {
  EMAIL_INDEX,
  elasticsearch,
} from "../../integrations/elasticsearch/client.js";

export interface EmailSearchFilters {
  userId: string;
  query?: string;
  status?: string;
  campaignId?: string;
  senderId?: string;
  page: number;
  limit: number;
}

export async function searchEmails(
  filters: EmailSearchFilters,
) {
  const {
    userId,
    query,
    status,
    campaignId,
    senderId,
    page,
    limit,
  } = filters;

  const must: Record<string, unknown>[] = [
    {
      term: {
        userId,
      },
    },
  ];

  if (query?.trim()) {
    must.push({
      multi_match: {
        query: query.trim(),
        fields: [
          "recipient",
          "subject",
          "body",
        ],
      },
    });
  }

  if (status) {
    must.push({
      term: {
        status,
      },
    });
  }

  if (campaignId) {
    must.push({
      term: {
        campaignId,
      },
    });
  }

  if (senderId) {
    must.push({
      term: {
        senderId,
      },
    });
  }

  const from = (page - 1) * limit;

  const response = await elasticsearch.search({
    index: EMAIL_INDEX,
    from,
    size: limit,

    query: {
      bool: {
        must,
      },
    },

    sort: [
      {
        updatedAt: {
          order: "desc",
        },
      },
    ],
  });

  const total =
    typeof response.hits.total === "number"
      ? response.hits.total
      : response.hits.total?.value ?? 0;

  return {
    data: response.hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source ?? {}),
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
