import { describe, it, expect } from "vitest";
import { calculate, buildPayload } from "@/lib/engine";
import { sanitizeForPublicOffer } from "@/lib/server/public-offer";
import type { BuilderState } from "@/lib/types";
import { MTMT_FIXTURE, MTMT_PRICING, MTMT_NEED } from "./fixtures/mtmt";

function mtmtState(): BuilderState {
  return {
    client: {
      companyName: "MTMT Corp",
      projectName: "Refonte MTMT",
      industry: "Services",
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
      integrationCount: 0,
      volume: "Faible",
      ...MTMT_NEED,
    },
    pricing: { ...MTMT_PRICING },
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
    selectedModules: new Set(MTMT_FIXTURE),
    openDomains: new Set(),
    currentPack: "grow",
  };
}

describe("BO-09 — Public offer never leaks ADAI-internal ROI data", () => {
  it("only exposes the client-authorized fields", () => {
    const state = mtmtState();
    const payload = buildPayload(state, calculate(state));
    const offer = sanitizeForPublicOffer(payload);

    expect(Object.keys(offer).sort()).toEqual(
      [
        "commercial_price",
        "company_name",
        "delivery_confidence",
        "delivery_days",
        "domains",
        "maintenance_year1_monthly",
        "modules",
        "pack",
        "project_name",
      ].sort()
    );
  });

  it("never contains internal ADAI cost/margin fields, even serialized", () => {
    const state = mtmtState();
    const payload = buildPayload(state, calculate(state));
    const offer = sanitizeForPublicOffer(payload);
    const serialized = JSON.stringify(offer);

    for (const forbidden of [
      "project_cost",
      "floor_price",
      "markup",
      "gross_profit",
      "gross_margin",
      "max_discount_rate",
      "gate",
      "roi_adai",
      "roi_client",
      "resourcePool",
      "structureCost",
      "directionCost",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("exposes the correct sanitized values for the MTMT fixture", () => {
    const state = mtmtState();
    const payload = buildPayload(state, calculate(state));
    const offer = sanitizeForPublicOffer(payload);

    expect(offer.company_name).toBe("MTMT Corp");
    expect(offer.pack).toBe("GROW");
    expect(offer.commercial_price).toBe(2560);
    expect(offer.maintenance_year1_monthly).toBe(200);
    expect(offer.delivery_days).toBe(5);
    expect(offer.modules).toEqual(expect.arrayContaining(MTMT_FIXTURE));
  });
});
