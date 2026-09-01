import type { ExportedPayload } from "@/lib/types";

export type PublicOffer = {
  company_name: string;
  project_name: string;
  pack: string;
  commercial_price: number;
  maintenance_year1_monthly: number;
  delivery_days: number;
  delivery_confidence: string;
  modules: string[];
  domains: string[];
};

// Only these client-authorized fields ever leave the server for a public offer.
// roi_adai and roi_client (project_cost, floor_price, markup, gross_profit,
// gross_margin, max_discount_rate, gate, ...) must never appear here.
export function sanitizeForPublicOffer(payload: ExportedPayload): PublicOffer {
  return {
    company_name: payload.client.companyName,
    project_name: payload.client.projectName,
    pack: payload.pricing.pack,
    commercial_price: payload.pricing.commercial_price,
    maintenance_year1_monthly: payload.pricing.maintenance_year1_monthly,
    delivery_days: payload.delivery.estimated_days,
    delivery_confidence: payload.delivery.confidence,
    modules: payload.scope.modules,
    domains: payload.scope.domains,
  };
}
