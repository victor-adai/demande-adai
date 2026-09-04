// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ReadjustPanel from "@/app/admin/(shell)/demandes/[id]/readjust-panel";
import type { ClientProfile, NeedProfile, PricingParams, RoiAdaiParams, RoiClientParams } from "@/lib/types";
import messages from "@/messages/fr.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const BASE_CLIENT: ClientProfile = {
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
};

const BASE_NEED: NeedProfile = {
  description: "",
  currentProcess: "Majoritairement manuel",
  migration: "Aucune / légère",
  customization: "Standard",
  sensitive: "Non",
  roles: "1 rôle",
  deliveryMode: "SCRATCH",
  integrationCount: 0,
  volume: "Faible",
};

const BASE_ROI_ADAI: RoiAdaiParams = {
  resourcePool: 1500,
  structureCost: 1500,
  directionCost: 1000,
  externalCosts: 0,
  licenseCosts: 0,
  otherCosts: 0,
  minMarkup: 1,
  allocationMode: "daily",
};

const BASE_PRICING: PricingParams = {
  discountRate: 0,
  productiveDays: 20,
  deliveryConfidence: "Moyenne",
};

const BASE_ROI_CLIENT: RoiClientParams = {
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
};

function renderPanel(
  overrides: { client?: Partial<ClientProfile>; need?: Partial<NeedProfile>; initialModules?: string[] } = {}
) {
  render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <ReadjustPanel
        demandeId="x"
        client={{ ...BASE_CLIENT, ...overrides.client }}
        need={{ ...BASE_NEED, ...overrides.need }}
        roiAdai={BASE_ROI_ADAI}
        pricing={BASE_PRICING}
        roiClient={BASE_ROI_CLIENT}
        initialPack="start"
        initialModules={overrides.initialModules ?? []}
        initialDiscountRate={0}
        initialRoiValidated={false}
        gate={true}
        status="submitted"
        publicUrl={null}
      />
    </NextIntlClientProvider>
  );
}

function requiredPackText() {
  const row = screen.getByText("Pack minimum requis").closest(".admin-field-row") as HTMLElement;
  return within(row).getAllByText(/START|GROW|SCALE/).pop()?.textContent;
}

describe("P1 — CURRENT vs PREVIEW (readjustment preview matches the real demande)", () => {
  it("reflects the demande's real organization in the pack preview, not a generic skeleton", () => {
    // organization "Multi-entités" forces SCALE (see engine.test.ts TC-06). A skeleton
    // hardcoded to "Mono-site / 1 entité" would wrongly show START here.
    renderPanel({ client: { organization: "Multi-entités" } });
    expect(requiredPackText()).toBe("SCALE");
  });

  it("reflects the demande's real sensitive-data flag, not a generic skeleton", () => {
    renderPanel({ need: { sensitive: "Oui" } });
    expect(requiredPackText()).toBe("SCALE");
  });

  it("uses the demande's real ROI ADAI costs, not zeroed-out figures, for the max discount", () => {
    // catalogValue=500 (1 cheap module) against BASE_ROI_ADAI's real fixed costs (4000/mo)
    // yields a floor price far above the catalog value, so maxDiscountRate must be 0%.
    // A skeleton that zeroes roiAdai would compute floorPrice=0 and wrongly report 100%.
    renderPanel({ initialModules: ["crm_prospects"] });
    const row = screen.getByText("Remise maximale autorisée").closest(".admin-field-row") as HTMLElement;
    expect(within(row).getByText("0 %")).toBeInTheDocument();
  });
});
