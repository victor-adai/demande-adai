import { z } from "zod";
import { DELIVERY_MODES } from "@/lib/data";

export const ClientSchema = z.object({
  companyName: z.string(),
  projectName: z.string(),
  industry: z.string(),
  subIndustry: z.string(),
  revenue: z.string(),
  companySize: z.string(),
  impactedPeople: z.string(),
  solutionUsers: z.string(),
  organization: z.string(),
  siteCount: z.number(),
  entityCount: z.number(),
  countries: z.string(),
  digitalMaturity: z.string(),
  itCapacity: z.string(),
  priority: z.string(),
  timeline: z.string(),
  budget: z.string(),
  currentTools: z.string(),
  painPoints: z.string(),
});

export const NeedSchema = z.object({
  description: z.string(),
  currentProcess: z.string(),
  migration: z.string(),
  customization: z.string(),
  sensitive: z.string(),
  roles: z.string(),
  deliveryMode: z.enum(DELIVERY_MODES),
  integrationCount: z.number(),
  volume: z.string(),
});

export const PricingSchema = z.object({
  discountRate: z.number(),
  productiveDays: z.number(),
  deliveryConfidence: z.string(),
});

export const RoiAdaiSchema = z.object({
  resourcePool: z.number(),
  structureCost: z.number(),
  directionCost: z.number(),
  externalCosts: z.number(),
  licenseCosts: z.number(),
  otherCosts: z.number(),
  minMarkup: z.number(),
  allocationMode: z.enum(["daily", "monthly"]),
});

export const RoiClientSchema = z.object({
  roiValidated: z.boolean(),
  weeklyHours: z.number(),
  roiPeople: z.number(),
  hourlyCost: z.number(),
  automationRate: z.number(),
  realizationRate: z.number(),
  errorsAvoided: z.number(),
  errorCost: z.number(),
  toolSavings: z.number(),
  additionalRevenue: z.number(),
  contributionMargin: z.number(),
  fteHours: z.number(),
  activeWeeks: z.number(),
});

export const CreateDemandeSchema = z.object({
  currentPack: z.enum(["start", "grow", "scale"]),
  selectedModules: z.array(z.string()),
  client: ClientSchema,
  need: NeedSchema,
  pricing: PricingSchema,
  roiAdai: RoiAdaiSchema,
  roiClient: RoiClientSchema,
});

export const ReadjustDemandeSchema = z.object({
  currentPack: z.enum(["start", "grow", "scale"]).optional(),
  selectedModules: z.array(z.string()).optional(),
  pricing: PricingSchema.partial().optional(),
  roiClient: RoiClientSchema.partial().optional(),
});

export type CreateDemandeInput = z.infer<typeof CreateDemandeSchema>;
export type ReadjustDemandeInput = z.infer<typeof ReadjustDemandeSchema>;
