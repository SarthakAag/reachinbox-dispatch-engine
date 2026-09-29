import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      id: "cmul9hicb000075hwcttr4mw0",
    },
  });

  if (!user) {
    throw new Error("Authenticated user was not found");
  }

  const sender = await prisma.sender.upsert({
    where: {
      userId_email: {
        userId: user.id,
        email: user.email,
      },
    },
    update: {
      displayName: user.name ?? "Sarthak Agarwal",
    },
    create: {
      userId: user.id,
      email: user.email,
      displayName: user.name ?? "Sarthak Agarwal",
    },
  });

  console.log({
    id: sender.id,
    email: sender.email,
    displayName: sender.displayName,
    userId: sender.userId,
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
