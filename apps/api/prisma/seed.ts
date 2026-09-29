import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@reachinbox.local",
    },
    update: {},
    create: {
      email: "demo@reachinbox.local",
      name: "ReachInbox Demo User",
    },
  });

  const sender = await prisma.sender.upsert({
    where: {
      userId_email: {
        userId: user.id,
        email: "sender@ethereal.email",
      },
    },
    update: {},
    create: {
      userId: user.id,
      email: "sender@ethereal.email",
      displayName: "ReachInbox Demo Sender",
    },
  });

  console.log("Seed complete:");
  console.log({
    userId: user.id,
    senderId: sender.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
