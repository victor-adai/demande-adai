import { describe, it, expect } from "vitest";
import type { Demande } from "@prisma/client";
import { evaluatePublishGuard } from "@/lib/server/demandes";
import type { PackKey } from "@/lib/data";

function makeDemande(overrides: { currentPack: PackKey; selectedModules: string[]; discountRate?: number }): Demande {
  return {
    id: "test-id",
    publicToken: "test-token",
    status: "submitted",
    currentPack: overrides.currentPack,
    selectedModules: JSON.stringify(overrides.selectedModules),
    client: JSON.stringify({
      companyName: "Test",
      projectName: "Test",
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
    }),
    need: JSON.stringify({
      description: "",
      currentProcess: "Majoritairement manuel",
      migration: "Aucune / légère",
      customization: "Standard",
      sensitive: "Non",
      roles: "1 rôle",
      deliveryMode: "SCRATCH",
      integrationCount: 0,
      volume: "Faible",
    }),
    pricing: JSON.stringify({
      discountRate: overrides.discountRate ?? 0,
      productiveDays: 20,
      deliveryConfidence: "Moyenne",
    }),
    roiAdai: JSON.stringify({
      resourcePool: 1500,
      structureCost: 1500,
      directionCost: 1000,
      externalCosts: 0,
      licenseCosts: 0,
      otherCosts: 0,
      minMarkup: 1,
      allocationMode: "daily",
    }),
    roiClient: JSON.stringify({
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
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
  };
}

describe("BO-PACK — admin pack consistency guard", () => {
  it("BO-PACK-01: START + GROW-forcing module -> requires GROW, blocked", () => {
    const demande = makeDemande({ currentPack: "start", selectedModules: ["data_advanced"] });
    const guard = evaluatePublishGuard(demande);

    expect(guard.requiredPack).toBe("grow");
    expect(guard.selectedPack).toBe("start");
    expect(guard.packConsistent).toBe(false);
    expect(guard.allowed).toBe(false);
    expect(guard.reasons.join(" ")).toContain("GROW");
  });

  it("BO-PACK-02: START + SCALE-forcing module -> requires SCALE, blocked", () => {
    const demande = makeDemande({ currentPack: "start", selectedModules: ["ai_multi"] });
    const guard = evaluatePublishGuard(demande);

    expect(guard.requiredPack).toBe("scale");
    expect(guard.packConsistent).toBe(false);
    expect(guard.allowed).toBe(false);
    expect(guard.reasons.join(" ")).toContain("SCALE");
  });

  it("BO-PACK-03: selected pack >= forced minimum -> no warning, publication allowed", () => {
    const demande = makeDemande({ currentPack: "grow", selectedModules: ["data_advanced"] });
    const guard = evaluatePublishGuard(demande);

    expect(guard.requiredPack).toBe("grow");
    expect(guard.packConsistent).toBe(true);
    expect(guard.allowed).toBe(true);
    expect(guard.reasons).toHaveLength(0);
  });

  it("staying on SCALE with only a GROW-forcing module is consistent (forcedPack never downgrades)", () => {
    // forcedPack() takes the current pack into account for the GROW-tier trigger: a state
    // already on SCALE stays on SCALE (scale already satisfies a grow-level requirement).
    const demande = makeDemande({ currentPack: "scale", selectedModules: ["data_advanced"] });
    const guard = evaluatePublishGuard(demande);

    expect(guard.requiredPack).toBe("scale");
    expect(guard.packConsistent).toBe(true);
    expect(guard.allowed).toBe(true);
  });
});

describe("BO-DISCOUNT — discount safety guard", () => {
  it("discount within the engine's max -> allowed", () => {
    const demande = makeDemande({ currentPack: "start", selectedModules: [], discountRate: 0 });
    const guard = evaluatePublishGuard(demande);

    expect(guard.discountWithinLimit).toBe(true);
    expect(guard.allowed).toBe(true);
  });

  it("discount above the engine's max -> blocked", () => {
    // catalog small (single cheap module) so maxDiscountRate is low; discountRate set far above it.
    const demande = makeDemande({ currentPack: "start", selectedModules: ["crm_prospects"], discountRate: 0.99 });
    const guard = evaluatePublishGuard(demande);

    expect(guard.discountWithinLimit).toBe(false);
    expect(guard.allowed).toBe(false);
    expect(guard.reasons.join(" ")).toContain("remise");
  });
});
