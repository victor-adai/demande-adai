import { prisma } from "@/lib/prisma";
import ParametresForm from "./parametres-form";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const settings = await prisma.roiSettings.findUnique({ where: { id: "singleton" } });

  if (!settings) {
    return <div className="admin-empty">Paramètres ROI introuvables — exécutez le seed (`pnpm db:seed`).</div>;
  }

  return (
    <ParametresForm
      initial={{
        resourcePool: settings.resourcePool,
        structureCost: settings.structureCost,
        directionCost: settings.directionCost,
        externalCosts: settings.externalCosts,
        licenseCosts: settings.licenseCosts,
        otherCosts: settings.otherCosts,
        minMarkup: settings.minMarkup,
        allocationMode: settings.allocationMode as "daily" | "monthly",
        productiveDays: settings.productiveDays,
      }}
    />
  );
}
