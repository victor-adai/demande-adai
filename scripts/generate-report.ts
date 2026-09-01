import { calculate, buildPayload } from "@/lib/engine";
import type { BuilderState } from "@/lib/types";
import { MTMT_FIXTURE, MTMT_PRICING, MTMT_NEED } from "@/tests/fixtures/mtmt";

function emptyState(): BuilderState {
  return {
    client: {
      companyName: "",
      projectName: "",
      industry: "",
      subIndustry: "",
      revenue: "< 100 k€",
      companySize: "1–10",
      impactedPeople: "1–3",
      solutionUsers: "1–10",
      organization: "Mono-site / 1 entité",
      siteCount: 1,
      entityCount: 1,
      countries: "1 pays",
      digitalMaturity: "Faible",
      itCapacity: "Aucune",
      priority: "Faible",
      timeline: "< 1 mois",
      budget: "Non communiqué",
      currentTools: "",
      painPoints: "",
    },
    need: {
      description: "",
      currentProcess: "Majoritairement manuel",
      migration: "Aucune / légère",
      customization: "Standard",
      sensitive: "Non",
      roles: "1 rôle",
      deliveryMode: "SCRATCH",
      integrationCount: 0,
      volume: "Faible",
    },
    pricing: {
      discountRate: 0,
      productiveDays: 20,
      deliveryConfidence: "Moyenne",
    },
    roiAdai: {
      resourcePool: 1500,
      structureCost: 1500,
      directionCost: 1000,
      externalCosts: 0,
      licenseCosts: 0,
      otherCosts: 0,
      minMarkup: 1,
      allocationMode: "daily",
    },
    roiClient: {
      roiValidated: false,
      weeklyHours: 0,
      roiPeople: 1,
      hourlyCost: 0,
      automationRate: 0,
      realizationRate: 0,
      errorsAvoided: 0,
      errorCost: 0,
      toolSavings: 0,
      additionalRevenue: 0,
      contributionMargin: 0,
      fteHours: 1820,
      activeWeeks: 52,
    },
    selectedModules: new Set<string>(),
    openDomains: new Set<string>(),
    currentPack: "start",
  };
}

function mtmtState(): BuilderState {
  return {
    ...emptyState(),
    currentPack: "grow",
    selectedModules: new Set(MTMT_FIXTURE),
    pricing: { ...MTMT_PRICING },
    need: { ...emptyState().need, deliveryMode: MTMT_NEED.deliveryMode },
  };
}

const generic = emptyState();
const genericResult = calculate(generic);

const mtmt = mtmtState();
const mtmtResult = calculate(mtmt);

console.log("=== GENERIC INITIAL STATE ===");
console.log(`Pack: ${generic.currentPack.toUpperCase()}`);
console.log(`Domains: ${genericResult.activeDomainNames.length}`);
console.log(`Modules: ${genericResult.selectedIds.length}`);
console.log(`Discount: ${Math.round(generic.pricing.discountRate * 100)} %`);
console.log(`Catalog: ${Math.round(genericResult.catalogValue).toLocaleString("fr-FR")} €`);
console.log(`Commercial: ${Math.round(genericResult.commercialPrice).toLocaleString("fr-FR")} €`);

console.log("\n=== GENERIC RESET STATE ===");
console.log(`Pack: START`);
console.log(`Domains: 0`);
console.log(`Modules: 0`);
console.log(`Discount: 0 %`);

console.log("\n=== MTMT TEST FIXTURE ===");
console.log(`Pack: ${mtmt.currentPack.toUpperCase()}`);
console.log(`Modules: ${MTMT_FIXTURE.join(", ")}`);
console.log(`Catalog: ${Math.round(mtmtResult.catalogValue).toLocaleString("fr-FR")} €`);
console.log(`Discount: ${Math.round(mtmt.pricing.discountRate * 100)} %`);
console.log(`Commercial: ${Math.round(mtmtResult.commercialPrice).toLocaleString("fr-FR")} €`);
console.log(`Delivery: ${mtmtResult.estimatedDays} j`);
console.log(`Markup: ${Math.round(mtmtResult.markupPercent)} %`);
console.log(`Gate: ${mtmtResult.gate ? "GO" : "NO-GO"}`);

console.log("\n=== MTMT JSON PAYLOAD ===");
console.log(JSON.stringify(buildPayload(mtmt, mtmtResult), null, 2));
