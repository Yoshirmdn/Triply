import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  if (!email) throw new Error("SUPER_ADMIN_EMAIL is not set");
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "SUPER_ADMIN", isActive: true },
      create: { email, name: "Super Admin", role: "SUPER_ADMIN" },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SUPER_ADMIN_SEEDED",
        description: `Super Admin disiapkan: ${email}`,
      },
    });

    console.log(`Super Admin ready: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});