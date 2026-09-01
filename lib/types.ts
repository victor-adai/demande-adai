import { DeliveryMode, PackKey } from "./data";

export type ClientProfile = {
  companyName: string;
  projectName: string;
  industry: string;
  subIndustry: string;
  revenue: string;
  companySize: string;
  impactedPeople: string;
  solutionUsers: string;
  organization: string;
  siteCount: number;
  entityCount: number;
  countries: string;
  digitalMaturity: string;
  itCapacity: string;
  priority: string;
  timeline: string;
  budget: string;
  currentTools: string;
  painPoints: string;
};

export type NeedProfile = {
  description: string;
  currentProcess: string;
  migration: string;
  customization: string;
  sensitive: string;
  roles: string;
  deliveryMode: DeliveryMode;
  integrationCount: number;
  volume: string;
};

export type PricingParams = {
  discountRate: number;
  productiveDays: number;
  deliveryConfidence: string;
};

export type RoiAdaiParams = {
  resourcePool: number;
  structureCost: number;
  directionCost: number;
  externalCosts: number;
  licenseCosts: number;
  otherCosts: number;
  minMarkup: number;
  allocationMode: "daily" | "monthly";
};

export type RoiClientParams = {
  roiValidated: boolean;
  weeklyHours: number;
  roiPeople: number;
  hourlyCost: number;
  automationRate: number;
  realizationRate: number;
  errorsAvoided: number;
  errorCost: number;
  toolSavings: number;
  additionalRevenue: number;
  contributionMargin: number;
  fteHours: number;
  activeWeeks: number;
};

export type BuilderState = {
  client: ClientProfile;
  need: NeedProfile;
  pricing: PricingParams;
  roiAdai: RoiAdaiParams;
  roiClient: RoiClientParams;
  selectedModules: Set<string>;
  openDomains: Set<string>;
  currentPack: PackKey;
};

export type CalculationResult = {
  functionalValue: number;
  complexityAdjustment: number;
  catalogValue: number;
  estimatedDays: number;
  commercialPrice: number;
  maintenancePublicMonthly: number;
  maintenanceYear1Monthly: number;
  year1Revenue: number;
  internalDailyCost: number;
  adaiCost: number;
  floorPrice: number;
  markupPercent: number;
  grossProfit: number;
  grossMarginPercent: number;
  maxDiscountRate: number;
  gate: boolean;
  hoursSaved: number;
  grossTimeValue: number;
  realizedAnnualValue: number;
  fteEquivalent: number;
  clientInvestment: number;
  clientNetGain: number;
  clientRoiPercent: number;
  paybackMonths: number;
  activeDomainNames: string[];
  selectedIds: string[];
  forcedPack: PackKey;
};

export type ExportedPayload = {
  version: string;
  client: ClientProfile & {
    annual_revenue_range: string;
    company_size: string;
    impacted_people: string;
    solution_users: string;
    organization_type: string;
    site_count: number;
    entity_count: number;
    country_scope: string;
    digital_maturity: string;
    it_capacity: string;
    target_timeline: string;
    budget_range: string;
    current_tools: string;
    pain_points: string;
  };
  need: NeedProfile & {
    sensitive_data: string;
    integration_count: number;
  };
  scope: {
    domains: string[];
    modules: string[];
  };
  pricing: {
    pack: string;
    base_pack_price: number;
    functional_value: number;
    complexity_adjustment: number;
    catalog_value: number;
    discount_rate: number;
    commercial_price: number;
    maintenance_public_monthly: number;
    maintenance_year1_monthly: number;
    year1_revenue: number;
  };
  delivery: {
    estimated_days: number;
    confidence: string;
  };
  roi_adai: {
    fixed_monthly_cost: number;
    productive_days: number;
    internal_daily_cost: number;
    project_cost: number;
    min_markup: number;
    floor_price: number;
    markup_percent: number;
    gross_profit: number;
    gross_margin_percent: number;
    max_discount_rate: number;
    gate: boolean;
  };
  roi_client: RoiClientParams & {
    validated: boolean;
    status: "VALIDATED" | "PENDING_VALIDATION";
    hours_saved: number;
    gross_time_value: number;
    annual_realized_value: number | null;
    year1_investment: number;
    roi_percent: number | null;
    payback_months: number | null;
    fte_equivalent: number;
  };
};
