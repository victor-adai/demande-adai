import { DOMAINS, PACKS, PRESETS, type DeliveryMode, type PackKey } from "./data";
import type { BuilderState, CalculationResult, ExportedPayload } from "./types";

export function euro(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

export function pct(n: number): string {
  return `${(Math.round(n * 10) / 10).toLocaleString("fr-FR")} %`;
}

export function complexityAdjustment(state: BuilderState): number {
  let adj = 0;
  const { client, need } = state;
  const org = client.organization;
  const countries = client.countries;
  const migration = need.migration;
  const custom = need.customization;
  const volume = need.volume;
  const sensitive = need.sensitive;
  const integrations = need.integrationCount;

  if (org === "Multi-sites") adj += 250;
  if (org === "Multi-entités") adj += 500;
  if (org === "Groupe / réseau") adj += 650;
  if (org === "Multi-pays") adj += 1000;

  if (countries === "2–3 pays") adj += 500;
  if (countries === "4+ pays") adj += 1000;

  if (migration === "Simple") adj += 200;
  if (migration === "Multi-sources") adj += 500;
  if (migration === "Complexe") adj += 900;

  if (custom === "Adaptation significative") adj += 350;
  if (custom === "Spécifique") adj += 900;

  if (volume === "Élevée") adj += 250;
  if (volume === "Très élevée") adj += 600;

  if (sensitive === "Oui") adj += 600;

  if (integrations >= 3 && integrations <= 5) adj += 300;
  if (integrations > 5) adj += 700;

  return adj;
}

export function forcedPack(state: BuilderState): PackKey {
  const selectedIds = Array.from(state.selectedModules);
  const org = state.client.organization;

  if (
    ["Multi-entités", "Groupe / réseau", "Multi-pays"].includes(org) ||
    selectedIds.includes("ai_multi") ||
    selectedIds.includes("multi_country") ||
    state.need.integrationCount > 5 ||
    state.need.sensitive === "Oui"
  ) {
    return "scale";
  }

  if (
    org === "Multi-sites" ||
    state.need.integrationCount >= 3 ||
    selectedIds.includes("data_advanced") ||
    selectedIds.includes("ai_agent") ||
    selectedIds.includes("site_client") ||
    selectedIds.includes("auto_multi")
  ) {
    return state.currentPack === "scale" ? "scale" : "grow";
  }

  return state.currentPack;
}

export function estimateDays(pack: PackKey, catalogValue: number, state: BuilderState): number {
  const mode = state.need.deliveryMode;
  let days = PACKS[pack].baseDays[mode] ?? PACKS[pack].baseDays.SCRATCH;
  const extra = Math.max(0, catalogValue - PACKS[pack].base);
  days += Math.ceil(extra / 1200);
  if (state.need.migration === "Multi-sources") days += 2;
  if (state.need.migration === "Complexe") days += 4;
  if (state.need.customization === "Spécifique") days += 3;
  if (state.need.integrationCount > 3) days += 2;
  return Math.max(2, days);
}

export function maintenanceValue(selectedMaint: number): number {
  return Math.max(0, selectedMaint);
}

export function calculate(state: BuilderState): CalculationResult {
  const selected = Array.from(state.selectedModules);

  let functional = 0;
  let maintRaw = 0;
  const activeDomainNamesSet = new Set<string>();

  for (const domain of DOMAINS) {
    for (const mod of domain.mods) {
      if (state.selectedModules.has(mod.id)) {
        functional += mod.build;
        maintRaw += mod.maint;
        activeDomainNamesSet.add(domain.name);
      }
    }
  }

  const forced = forcedPack(state);
  const complexity = complexityAdjustment(state);
  const catalog = functional + complexity;
  const discount = state.pricing.discountRate;
  const commercial = catalog * (1 - discount);
  const publicMaint = maintenanceValue(maintRaw);
  const maint = publicMaint * (1 - discount);
  const days = estimateDays(forced, catalog, state);

  // ROI ADAI
  const fixedMonthly = state.roiAdai.resourcePool + state.roiAdai.structureCost + state.roiAdai.directionCost;
  const productive = Math.max(1, state.pricing.productiveDays);
  const daily = fixedMonthly / productive;
  const alloc = state.roiAdai.allocationMode === "monthly" ? fixedMonthly : daily * days;
  const adaiCost = alloc + state.roiAdai.externalCosts + state.roiAdai.licenseCosts + state.roiAdai.otherCosts;
  const minMarkup = state.roiAdai.minMarkup;
  const floor = adaiCost * (1 + minMarkup);
  const markup = adaiCost > 0 ? ((commercial - adaiCost) / adaiCost) * 100 : 0;
  const grossProfit = commercial - adaiCost;
  const grossMargin = commercial > 0 ? (grossProfit / commercial) * 100 : 0;
  const maxDiscount = catalog > 0 ? Math.max(0, Math.min(1, 1 - floor / catalog)) : 0;
  const gate = commercial >= floor;

  // ROI client
  const weeks = state.roiClient.activeWeeks;
  const weekly = state.roiClient.weeklyHours;
  const people = state.roiClient.roiPeople;
  const hourly = state.roiClient.hourlyCost;
  const auto = state.roiClient.automationRate / 100;
  const realization = state.roiClient.realizationRate / 100;
  const hoursSaved = weekly * people * weeks * auto;
  const grossTime = hoursSaved * hourly;
  const realizedTime = grossTime * realization;
  const errorGain = state.roiClient.errorsAvoided * state.roiClient.errorCost;
  const toolGain = state.roiClient.toolSavings;
  const marginGain = state.roiClient.additionalRevenue * (state.roiClient.contributionMargin / 100);
  const annualValue = realizedTime + errorGain + toolGain + marginGain;
  const investment = commercial + maint * 12;
  const netGain = annualValue - investment;
  const roi = investment > 0 ? (netGain / investment) * 100 : 0;
  const payback = annualValue > 0 ? investment / (annualValue / 12) : 0;
  const fte = state.roiClient.fteHours > 0 ? hoursSaved / state.roiClient.fteHours : 0;

  return {
    functionalValue: functional,
    complexityAdjustment: complexity,
    catalogValue: catalog,
    estimatedDays: days,
    commercialPrice: commercial,
    maintenancePublicMonthly: publicMaint,
    maintenanceYear1Monthly: maint,
    year1Revenue: commercial + maint * 12,
    internalDailyCost: daily,
    adaiCost,
    floorPrice: floor,
    markupPercent: markup,
    grossProfit,
    grossMarginPercent: grossMargin,
    maxDiscountRate: maxDiscount * 100,
    gate,
    hoursSaved,
    grossTimeValue: grossTime,
    realizedAnnualValue: annualValue,
    fteEquivalent: fte,
    clientInvestment: investment,
    clientNetGain: netGain,
    clientRoiPercent: roi,
    paybackMonths: payback,
    activeDomainNames: Array.from(activeDomainNamesSet),
    selectedIds: selected,
    forcedPack: forced,
  };
}

export function applyPreset(pack: PackKey): {
  selectedModules: Set<string>;
  discountRate: number;
  deliveryMode: DeliveryMode;
} {
  return {
    selectedModules: new Set(PRESETS[pack] ?? []),
    discountRate: pack === "grow" ? 0.2 : 0,
    deliveryMode:
      pack === "grow" ? "SAAS_ADAPT" : pack === "start" ? "CORE_REUSE" : "PARTIAL_REUSE",
  };
}

export function buildPayload(state: BuilderState, result: CalculationResult): ExportedPayload {
  const { client, need, pricing, roiAdai, roiClient } = state;
  return {
    version: "V6_MASTER",
    client: {
      ...client,
      annual_revenue_range: client.revenue,
      company_size: client.companySize,
      impacted_people: client.impactedPeople,
      solution_users: client.solutionUsers,
      organization_type: client.organization,
      site_count: client.siteCount,
      entity_count: client.entityCount,
      country_scope: client.countries,
      digital_maturity: client.digitalMaturity,
      it_capacity: client.itCapacity,
      target_timeline: client.timeline,
      budget_range: client.budget,
      current_tools: client.currentTools,
      pain_points: client.painPoints,
    },
    need: {
      ...need,
      sensitive_data: need.sensitive,
      integration_count: need.integrationCount,
    },
    scope: {
      domains: result.activeDomainNames,
      modules: result.selectedIds,
    },
    pricing: {
      pack: PACKS[result.forcedPack].label,
      base_pack_price: PACKS[result.forcedPack].base,
      functional_value: result.functionalValue,
      complexity_adjustment: result.complexityAdjustment,
      catalog_value: result.catalogValue,
      discount_rate: pricing.discountRate,
      commercial_price: result.commercialPrice,
      maintenance_public_monthly: result.maintenancePublicMonthly,
      maintenance_year1_monthly: result.maintenanceYear1Monthly,
      year1_revenue: result.year1Revenue,
    },
    delivery: {
      estimated_days: result.estimatedDays,
      confidence: pricing.deliveryConfidence,
    },
    roi_adai: {
      fixed_monthly_cost: roiAdai.resourcePool + roiAdai.structureCost + roiAdai.directionCost,
      productive_days: pricing.productiveDays,
      internal_daily_cost: result.internalDailyCost,
      project_cost: result.adaiCost,
      min_markup: roiAdai.minMarkup,
      floor_price: result.floorPrice,
      markup_percent: result.markupPercent,
      gross_profit: result.grossProfit,
      gross_margin_percent: result.grossMarginPercent,
      max_discount_rate: result.maxDiscountRate,
      gate: result.gate,
    },
    roi_client: {
      ...roiClient,
      validated: roiClient.roiValidated,
      status: roiClient.roiValidated ? "VALIDATED" : "PENDING_VALIDATION",
      hours_saved: result.hoursSaved,
      gross_time_value: result.grossTimeValue,
      annual_realized_value: roiClient.roiValidated ? result.realizedAnnualValue : null,
      year1_investment: result.clientInvestment,
      roi_percent: roiClient.roiValidated ? result.clientRoiPercent : null,
      payback_months: roiClient.roiValidated ? result.paybackMonths : null,
      fte_equivalent: result.fteEquivalent,
    },
  };
}
