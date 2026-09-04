import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import ParametresForm from "./parametres-form";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const settings = await prisma.roiSettings.findUnique({ where: { id: "singleton" } });

  if (!settings) {
    const t = await getTranslations("AdminParametres");
    return <div className="admin-empty">{t("missing")}</div>;
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
