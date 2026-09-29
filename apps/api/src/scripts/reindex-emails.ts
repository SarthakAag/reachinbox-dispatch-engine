import "../config/env.js";

import { prisma } from "../lib/prisma.js";
import { syncEmailToSearch } from "../integrations/elasticsearch/email-sync.service.js";

async function main() {
  const emails = await prisma.email.findMany({
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(
    `[reindex] Found ${emails.length} emails in PostgreSQL`,
  );

  let indexed = 0;

  for (const email of emails) {
    await syncEmailToSearch(email.id);
    indexed += 1;

    console.log(
      `[reindex] ${indexed}/${emails.length} indexed`,
    );
  }

  console.log(
    `[reindex] Completed: ${indexed} emails indexed`,
  );
}

main()
  .catch((error) => {
    console.error(
      "[reindex] Failed:",
      error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
