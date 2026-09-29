import { Client } from "@elastic/elasticsearch";

const url =
  process.env.ELASTICSEARCH_URL ??
  "http://localhost:9200";

export const elasticsearch = new Client({
  node: url,
});

export const EMAIL_INDEX =
  process.env.ELASTICSEARCH_INDEX ??
  "reachinbox-emails";
