import { describe, it, expect } from "vitest";
import { PACKS, PRESETS, type DeliveryMode } from "@/lib/data";
import {
  calculate,
  applyPreset,
  complexityAdjustment,
  forcedPack,
  estimateDays,
  maintenanceValue,
  buildPayload,
} from "@/lib/engine";
import { resetBuilderState } from "@/components/cockpit-builder";
import type { BuilderState } from "@/lib/types";
import { MTMT_FIXTURE, MTMT_PRICING, MTMT_NEED } from "./fixtures/mtmt";

function emptyState(overrides: Partial<BuilderState> = {}): BuilderState {
  const base: BuilderState = {
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
  return { ...base, ...overrides };
}

function withModules(state: BuilderState, ids: string[]): BuilderState {
  return { ...state, selectedModules: new Set(ids) };
}

function withClient(state: BuilderState, patch: Partial<BuilderState["client"]>): BuilderState {
  return { ...state, client: { ...state.client, ...patch } };
}

function withNeed(state: BuilderState, patch: Partial<BuilderState["need"]>): BuilderState {
  return { ...state, need: { ...state.need, ...patch } };
}

function withPricing(state: BuilderState, patch: Partial<BuilderState["pricing"]>): BuilderState {
  return { ...state, pricing: { ...state.pricing, ...patch } };
}

function withRoiClient(state: BuilderState, patch: Partial<BuilderState["roiClient"]>): BuilderState {
  return { ...state, roiClient: { ...state.roiClient, ...patch } };
}

function withDeliveryMode(state: BuilderState, mode: DeliveryMode): BuilderState {
  return withNeed(state, { deliveryMode: mode });
}

function mtmtBaseState(): BuilderState {
  return withModules(
    withPricing(
      withNeed(
        emptyState({ currentPack: "grow" }),
        MTMT_NEED
      ),
      MTMT_PRICING
    ),
    MTMT_FIXTURE
  );
}

function buildMTMTResult() {
  return calculate(mtmtBaseState());
}

describe("TC-01 — GENERIC INITIAL STATE", () => {
  it("starts with START, no modules, 0 discount, 0 catalog", () => {
    const state = emptyState();
    expect(state.currentPack).toBe("start");
    expect(state.selectedModules.size).toBe(0);
    expect(state.pricing.discountRate).toBe(0);

    const r = calculate(state);
    expect(r.forcedPack).toBe("start");
    expect(r.functionalValue).toBe(0);
    expect(r.catalogValue).toBe(0);
    expect(r.commercialPrice).toBe(0);
    expect(r.estimatedDays).toBe(PACKS.start.baseDays.SCRATCH);
  });
});

describe("TC-02 / TC-03 — Pack selection does not auto-select modules", () => {
  it("GROW selected alone leaves modules empty", () => {
    const state = emptyState({ currentPack: "grow" });
    expect(state.selectedModules.size).toBe(0);
    const r = calculate(state);
    expect(r.forcedPack).toBe("grow");
    expect(r.selectedIds.length).toBe(0);
  });

  it("SCALE selected alone leaves modules empty", () => {
    const state = emptyState({ currentPack: "scale" });
    expect(state.selectedModules.size).toBe(0);
    const r = calculate(state);
    expect(r.forcedPack).toBe("scale");
    expect(r.selectedIds.length).toBe(0);
  });
});

describe("TC-PRESET — applyPreset loads generic MASTER presets", () => {
  it("applyPreset('start') loads PRESETS.start, discount 0, CORE_REUSE", () => {
    const preset = applyPreset("start");
    expect(Array.from(preset.selectedModules).sort()).toEqual([...PRESETS.start].sort());
    expect(preset.discountRate).toBe(0);
    expect(preset.deliveryMode).toBe("CORE_REUSE");
  });

  it("applyPreset('grow') loads PRESETS.grow, discount 20%, SAAS_ADAPT", () => {
    const preset = applyPreset("grow");
    expect(Array.from(preset.selectedModules).sort()).toEqual([...PRESETS.grow].sort());
    expect(preset.discountRate).toBe(0.2);
    expect(preset.deliveryMode).toBe("SAAS_ADAPT");
  });

  it("applyPreset('scale') loads PRESETS.scale, discount 0, PARTIAL_REUSE", () => {
    const preset = applyPreset("scale");
    expect(Array.from(preset.selectedModules).sort()).toEqual([...PRESETS.scale].sort());
    expect(preset.discountRate).toBe(0);
    expect(preset.deliveryMode).toBe("PARTIAL_REUSE");
  });
});

describe("TC-04 — MTMT CALIBRATION", () => {
  it("matches MTMT fixture values", () => {
    const r = buildMTMTResult();
    expect(r.forcedPack).toBe("grow");
    expect(r.selectedIds).toEqual(expect.arrayContaining(MTMT_FIXTURE));
    expect(r.functionalValue).toBe(3200);
    expect(r.catalogValue).toBe(3200);
    expect(r.commercialPrice).toBe(2560);
    expect(r.estimatedDays).toBe(5);
    expect(Math.round(r.markupPercent)).toBe(156);
    expect(r.gate).toBe(true);
  });
});

describe("TC-05 / TC-06 / TC-07 / TC-08 / TC-09 — Complexity & forcing", () => {
  it("TC-05: Multi-sites adds 250 and forces GROW", () => {
    const state = withClient(emptyState({ currentPack: "start" }), { organization: "Multi-sites" });
    expect(complexityAdjustment(state)).toBe(250);
    expect(forcedPack(state)).toBe("grow");
  });

  it("TC-06: Multi-entités adds 500 and forces SCALE", () => {
    const state = withClient(emptyState({ currentPack: "start" }), { organization: "Multi-entités" });
    expect(complexityAdjustment(state)).toBe(500);
    expect(forcedPack(state)).toBe("scale");
  });

  it("TC-07: sensitive=Oui adds 600 and forces SCALE", () => {
    const state = withNeed(emptyState({ currentPack: "start" }), { sensitive: "Oui" });
    expect(complexityAdjustment(state)).toBe(600);
    expect(forcedPack(state)).toBe("scale");
  });

  it("TC-08: integrations = 3 adds 300 and forces GROW", () => {
    const state = withNeed(emptyState({ currentPack: "start" }), { integrationCount: 3 });
    expect(complexityAdjustment(state)).toBe(300);
    expect(forcedPack(state)).toBe("grow");
  });

  it("TC-09: integrations = 6 adds 700 and forces SCALE", () => {
    const state = withNeed(emptyState({ currentPack: "start" }), { integrationCount: 6 });
    expect(complexityAdjustment(state)).toBe(700);
    expect(forcedPack(state)).toBe("scale");
  });
});

describe("TC-10 — ADVANCED MODULE FORCING", () => {
  it("data_advanced forces GROW", () => {
    const state = withModules(emptyState({ currentPack: "start" }), ["data_advanced"]);
    expect(forcedPack(state)).toBe("grow");
  });

  it("ai_agent forces GROW", () => {
    const state = withModules(emptyState({ currentPack: "start" }), ["ai_agent"]);
    expect(forcedPack(state)).toBe("grow");
  });

  it("ai_multi forces SCALE", () => {
    const state = withModules(emptyState({ currentPack: "start" }), ["ai_multi"]);
    expect(forcedPack(state)).toBe("scale");
  });

  it("site_client forces GROW", () => {
    const state = withModules(emptyState({ currentPack: "start" }), ["site_client"]);
    expect(forcedPack(state)).toBe("grow");
  });

  it("auto_multi forces GROW", () => {
    const state = withModules(emptyState({ currentPack: "start" }), ["auto_multi"]);
    expect(forcedPack(state)).toBe("grow");
  });

  it("ai_assistant does NOT force GROW/SCALE", () => {
    const state = withModules(emptyState({ currentPack: "start" }), ["ai_assistant"]);
    expect(forcedPack(state)).toBe("start");
  });
});

describe("TC-11 — DELIVERY", () => {
  it("returns expected base days per mode", () => {
    const base = withModules(emptyState({ currentPack: "grow" }), MTMT_FIXTURE);
    expect(estimateDays("grow", 3200, withDeliveryMode(base, "SCRATCH"))).toBe(24);
    expect(estimateDays("grow", 3200, withDeliveryMode(base, "PARTIAL_REUSE"))).toBe(12);
    expect(estimateDays("grow", 3200, withDeliveryMode(base, "CORE_REUSE"))).toBe(8);
    expect(estimateDays("grow", 3200, withDeliveryMode(base, "SAAS_ADAPT"))).toBe(5);
    expect(estimateDays("grow", 3200, withDeliveryMode(base, "STANDARD_DEPLOY"))).toBe(4);
  });

  it("adds days for migration Multi-sources", () => {
    const state = withDeliveryMode(withNeed(emptyState({ currentPack: "grow" }), { migration: "Multi-sources" }), "SAAS_ADAPT");
    expect(estimateDays("grow", 3200, withModules(state, MTMT_FIXTURE))).toBe(7);
  });

  it("adds days for migration Complexe", () => {
    const state = withDeliveryMode(withNeed(emptyState({ currentPack: "grow" }), { migration: "Complexe" }), "SAAS_ADAPT");
    expect(estimateDays("grow", 3200, withModules(state, MTMT_FIXTURE))).toBe(9);
  });

  it("adds days for customization Spécifique", () => {
    const state = withDeliveryMode(withNeed(emptyState({ currentPack: "grow" }), { customization: "Spécifique" }), "SAAS_ADAPT");
    expect(estimateDays("grow", 3200, withModules(state, MTMT_FIXTURE))).toBe(8);
  });

  it("adds days for integrationCount > 3", () => {
    const state = withDeliveryMode(withNeed(emptyState({ currentPack: "grow" }), { integrationCount: 4 }), "SAAS_ADAPT");
    expect(estimateDays("grow", 3200, withModules(state, MTMT_FIXTURE))).toBe(7);
  });

  it("adds days for catalog above pack base", () => {
    // Base GROW = 4500; catalog 6900 => extra 2400 => +2 days
    expect(estimateDays("grow", 6900, withDeliveryMode(emptyState({ currentPack: "grow" }), "SAAS_ADAPT"))).toBe(7);
  });
});

describe("TC-12 — ROI ADAI", () => {
  it("GO case with default MTMT values", () => {
    const r = buildMTMTResult();
    expect(r.adaiCost).toBe(1000);
    expect(r.floorPrice).toBe(2000);
    expect(r.grossProfit).toBe(1560);
    expect(r.gate).toBe(true);
  });

  it("FAIL case with high internal costs", () => {
    const state = withModules(
      withNeed(
        withPricing(
          emptyState({
            currentPack: "grow",
            roiAdai: {
              resourcePool: 15000,
              structureCost: 15000,
              directionCost: 10000,
              externalCosts: 0,
              licenseCosts: 0,
              otherCosts: 0,
              minMarkup: 1,
              allocationMode: "daily",
            },
          }),
          MTMT_PRICING
        ),
        MTMT_NEED
      ),
      MTMT_FIXTURE
    );
    const r = calculate(state);
    expect(r.gate).toBe(false);
    expect(r.commercialPrice).toBe(2560);
    expect(r.floorPrice).toBeGreaterThan(r.commercialPrice);
  });
});

describe("TC-13A — ROI CLIENT ENGINE", () => {
  it("before validation returns 0 for client ROI", () => {
    const state = emptyState();
    const r = calculate(state);
    expect(state.roiClient.roiValidated).toBe(false);
    expect(r.clientRoiPercent).toBe(0);
  });

  it("after validation computes ROI, payback and FTE", () => {
    const state = withModules(
      withRoiClient(
        mtmtBaseState(),
        {
          roiValidated: true,
          weeklyHours: 10,
          roiPeople: 5,
          hourlyCost: 50,
          automationRate: 70,
          realizationRate: 60,
          errorsAvoided: 2,
          errorCost: 1000,
          toolSavings: 0,
          additionalRevenue: 0,
          contributionMargin: 40,
          fteHours: 1820,
          activeWeeks: 52,
        }
      ),
      MTMT_FIXTURE
    );
    const r = calculate(state);
    expect(r.hoursSaved).toBe(10 * 5 * 52 * 0.7);
    expect(r.grossTimeValue).toBe(r.hoursSaved * 50);
    expect(r.realizedAnnualValue).toBe(r.grossTimeValue * 0.6 + 2 * 1000);
    expect(r.clientInvestment).toBe(2560 + r.maintenanceYear1Monthly * 12);
    expect(r.clientRoiPercent).toBeGreaterThan(0);
    expect(r.paybackMonths).toBeGreaterThan(0);
  });
});

describe("TC-14 — RESET", () => {
  it("resetBuilderState clears all selections and returns to generic START state", () => {
    const filled = withModules(
      withClient(
        withPricing(
          withNeed(
            emptyState({ currentPack: "grow" }),
            { sensitive: "Oui", integrationCount: 6 }
          ),
          { discountRate: 0.2 }
        ),
        { companyName: "Test", organization: "Multi-entités" }
      ),
      MTMT_FIXTURE
    );
    expect(filled.selectedModules.size).toBe(3);
    expect(filled.currentPack).toBe("grow");
    expect(filled.pricing.discountRate).toBe(0.2);
    expect(filled.need.sensitive).toBe("Oui");

    const reset = resetBuilderState();
    expect(reset.currentPack).toBe("start");
    expect(reset.selectedModules.size).toBe(0);
    expect(reset.openDomains.size).toBe(0);
    expect(reset.client.companyName).toBe("");
    expect(reset.client.organization).toBe("Mono-site / 1 entité");
    expect(reset.pricing.discountRate).toBe(0);
    expect(reset.need.sensitive).toBe("Non");

    const r = calculate(reset);
    expect(r.catalogValue).toBe(0);
    expect(r.commercialPrice).toBe(0);
    expect(r.selectedIds.length).toBe(0);
  });
});

describe("TC-MAINT — Maintenance calculation", () => {
  it("maintenanceValue returns max(0, raw)", () => {
    expect(maintenanceValue(250)).toBe(250);
    expect(maintenanceValue(-50)).toBe(0);
  });

  it("MTMT public maintenance is 250 €/mois before discount", () => {
    const r = buildMTMTResult();
    expect(r.maintenancePublicMonthly).toBe(250);
  });

  it("MTMT year 1 maintenance is 200 €/mois after 20 % discount", () => {
    const r = buildMTMTResult();
    expect(r.maintenanceYear1Monthly).toBe(200);
  });
});

describe("TC-BOUNDARY — Complexity thresholds", () => {
  it("integrations = 2 triggers nothing", () => {
    const state = withNeed(emptyState(), { integrationCount: 2 });
    expect(complexityAdjustment(state)).toBe(0);
    expect(forcedPack(state)).toBe("start");
  });

  it("integrations = 3 adds 300 and forces GROW", () => {
    const state = withNeed(emptyState(), { integrationCount: 3 });
    expect(complexityAdjustment(state)).toBe(300);
    expect(forcedPack(state)).toBe("grow");
  });

  it("integrations = 5 adds 300 and forces GROW", () => {
    const state = withNeed(emptyState(), { integrationCount: 5 });
    expect(complexityAdjustment(state)).toBe(300);
    expect(forcedPack(state)).toBe("grow");
  });

  it("countries = 2–3 adds 500", () => {
    const state = withClient(emptyState(), { countries: "2–3 pays" });
    expect(complexityAdjustment(state)).toBe(500);
  });

  it("countries = 4+ adds 1000", () => {
    const state = withClient(emptyState(), { countries: "4+ pays" });
    expect(complexityAdjustment(state)).toBe(1000);
  });

  it("migration Simple adds 200", () => {
    const state = withNeed(emptyState(), { migration: "Simple" });
    expect(complexityAdjustment(state)).toBe(200);
  });

  it("customization Adaptation significative adds 350", () => {
    const state = withNeed(emptyState(), { customization: "Adaptation significative" });
    expect(complexityAdjustment(state)).toBe(350);
  });

  it("volume Élevée adds 250", () => {
    const state = withNeed(emptyState(), { volume: "Élevée" });
    expect(complexityAdjustment(state)).toBe(250);
  });
});

describe("TC-17A — JSON payload structure", () => {
  it("exports the expected structure for MTMT", () => {
    const state = mtmtBaseState();
    const r = calculate(state);
    const payload = buildPayload(state, r);

    expect(payload.version).toBe("V6_MASTER");
    expect(payload.scope.modules).toEqual(expect.arrayContaining(MTMT_FIXTURE));
    expect(payload.scope.domains).toEqual(["Direction & Pilotage", "Site / Portail digital", "Planning & Réservation"]);
    expect(payload.pricing.pack).toBe("GROW");
    expect(payload.pricing.base_pack_price).toBe(PACKS.grow.base);
    expect(payload.pricing.functional_value).toBe(3200);
    expect(payload.pricing.complexity_adjustment).toBe(0);
    expect(payload.pricing.catalog_value).toBe(3200);
    expect(payload.pricing.discount_rate).toBe(0.2);
    expect(payload.pricing.commercial_price).toBe(2560);
    expect(payload.pricing.maintenance_public_monthly).toBe(250);
    expect(payload.pricing.maintenance_year1_monthly).toBe(200);
    expect(payload.pricing.year1_revenue).toBe(4960);

    expect(payload.delivery.estimated_days).toBe(5);

    expect(payload.roi_adai.project_cost).toBe(1000);
    expect(payload.roi_adai.floor_price).toBe(2000);
    expect(payload.roi_adai.markup_percent).toBeGreaterThan(150);
    expect(payload.roi_adai.gross_profit).toBe(1560);
    expect(payload.roi_adai.gross_margin_percent).toBeCloseTo(60.9, 0);
    expect(payload.roi_adai.max_discount_rate).toBeGreaterThan(0);
    expect(payload.roi_adai.gate).toBe(true);

    expect(payload.roi_client.validated).toBe(false);
    expect(payload.roi_client.status).toBe("PENDING_VALIDATION");
    expect(payload.roi_client.annual_realized_value).toBeNull();
    expect(payload.roi_client.year1_investment).toBe(4960);
    expect(payload.roi_client.roi_percent).toBeNull();
    expect(payload.roi_client.payback_months).toBeNull();
    expect(payload.roi_client.fte_equivalent).toBe(0);
  });

  it("exposes real ROI figures once hypotheses are validated", () => {
    const state = withRoiClient(mtmtBaseState(), {
      roiValidated: true,
      weeklyHours: 10,
      roiPeople: 5,
      hourlyCost: 50,
      automationRate: 70,
      realizationRate: 60,
      errorsAvoided: 2,
      errorCost: 1000,
    });
    const r = calculate(state);
    const payload = buildPayload(state, r);

    expect(payload.roi_client.validated).toBe(true);
    expect(payload.roi_client.status).toBe("VALIDATED");
    expect(payload.roi_client.annual_realized_value).toBe(r.realizedAnnualValue);
    expect(payload.roi_client.roi_percent).toBe(r.clientRoiPercent);
    expect(payload.roi_client.payback_months).toBe(r.paybackMonths);
    expect(payload.roi_client.roi_percent).toBeGreaterThan(0);
  });
});
