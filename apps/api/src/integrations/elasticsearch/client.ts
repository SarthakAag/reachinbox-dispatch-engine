import { Client } from "@elastic/elasticsearch";

const url =
  process.env.ELASTICSEARCH_URL ??
  "http://localhost:9200";

const apiKey =
  process.env.ELASTICSEARCH_API_KEY;

export const elasticsearch = new Client({
  node: url,
  ...(apiKey
    ? {
        auth: {
          apiKey,
        },
      }
    : {}),
});

export const EMAIL_INDEX =
  process.env.ELASTICSEARCH_INDEX ??
  "reachinbox-emails";
