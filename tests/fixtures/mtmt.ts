/**
 * MTMT client fixture — test calibration only.
 * Must NEVER be loaded automatically in production.
 */
export const MTMT_FIXTURE: string[] = [
  "site_premium",
  "dir_cockpit",
  "plan_booking",
];

export const MTMT_PRICING = {
  discountRate: 0.2,
  productiveDays: 20,
  deliveryConfidence: "Haute",
} as const;

export const MTMT_NEED = {
  deliveryMode: "SAAS_ADAPT",
} as const;
