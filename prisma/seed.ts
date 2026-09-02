import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DOMAINS, PACKS, type PackKey } from "../lib/data";

const prisma = new PrismaClient();

async function main() {
  // Each concern below is independently idempotent (checked-then-created) — none of them
  // short-circuits the others, so re-running `pnpm db:seed` on an existing dev.db (e.g. the
  // admin already exists) still seeds anything still missing (RoiSettings, catalogue rows).
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@adai.local";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.admin.create({ data: { email, passwordHash } });
    console.log(`Seeded admin: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

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

  // Catalogue modules — created once per moduleId, never overwritten by re-seeding, so an
  // admin's price/label/active edits in the BO are never clobbered by a later `db:seed` run.
  let seededModules = 0;
  for (const domain of DOMAINS) {
    for (const mod of domain.mods) {
      const existingModule = await prisma.catalogModule.findUnique({ where: { moduleId: mod.id } });
      if (!existingModule) {
        await prisma.catalogModule.create({
          data: { moduleId: mod.id, name: mod.name, build: mod.build, maint: mod.maint, active: true },
        });
        seededModules += 1;
      }
    }
  }
  console.log(seededModules > 0 ? `Seeded ${seededModules} catalogue module(s)` : "Catalogue modules already seeded");

  // Catalogue packs — same idempotent pattern: never overwrites an admin's saved price edit.
  let seededPacks = 0;
  for (const key of Object.keys(PACKS) as PackKey[]) {
    const existingPack = await prisma.catalogPack.findUnique({ where: { packKey: key } });
    if (!existingPack) {
      await prisma.catalogPack.create({
        data: { packKey: key, base: PACKS[key].base, maint: PACKS[key].maint },
      });
      seededPacks += 1;
    }
  }
  console.log(seededPacks > 0 ? `Seeded ${seededPacks} catalogue pack(s)` : "Catalogue packs already seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
