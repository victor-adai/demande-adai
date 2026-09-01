import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@adai.local";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({ data: { email, passwordHash } });
  console.log(`Seeded admin: ${email}`);

  const settings = await prisma.roiSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    await prisma.roiSettings.create({
      data: {
        id: "singleton",
        resourcePool: 1500,
        structureCost: 1500,
        directionCost: 1000,
        externalCosts: 0,
        licenseCosts: 0,
        otherCosts: 0,
        minMarkup: 1,
        allocationMode: "daily",
        productiveDays: 20,
      },
    });
    console.log("Seeded default RoiSettings");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
