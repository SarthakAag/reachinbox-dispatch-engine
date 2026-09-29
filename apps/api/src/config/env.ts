import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(
    __dirname,
    "../../../../.env",
  ),
});

console.log(
  "[env] GOOGLE_CLIENT_ID loaded:",
  Boolean(process.env.GOOGLE_CLIENT_ID),
);

console.log(
  "[env] GOOGLE_CALLBACK_URL loaded:",
  Boolean(process.env.GOOGLE_CALLBACK_URL),
);