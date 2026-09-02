// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Demande } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    demande: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { publishDemande, getPublishedOfferByToken } from "@/lib/server/demandes";

function makeDemande(overrides: Partial<Demande> = {}): Demande {
  return {
    id: "demo-id",
    publicToken: "demo-token",
    status: "submitted",
    currentPack: "grow",
    selectedModules: JSON.stringify(["site_premium", "dir_cockpit", "plan_booking"]),
    client: JSON.stringify({
      companyName: "MTMT", projectName: "Refonte", industry: "", subIndustry: "",
      revenue: "< 100 k€", companySize: "1–10", impactedPeople: "1–3", solutionUsers: "1–10",
      organization: "Mono-site / 1 entité", siteCount: 1, entityCount: 1, countries: "1 pays",
      digitalMaturity: "Faible", itCapacity: "Aucune", priority: "Faible", timeline: "< 1 mois",
      budget: "Non communiqué", currentTools: "", painPoints: "",
    }),
    need: JSON.stringify({
      description: "", currentProcess: "Majoritairement manuel", migration: "Aucune / légère",
      customization: "Standard", sensitive: "Non", roles: "1 rôle", deliveryMode: "SAAS_ADAPT",
      integrationCount: 0, volume: "Faible",
    }),
    pricing: JSON.stringify({ discountRate: 0.2, productiveDays: 20, deliveryConfidence: "Moyenne" }),
    roiAdai: JSON.stringify({
      resourcePool: 1500, structureCost: 1500, directionCost: 1000, externalCosts: 0,
      licenseCosts: 0, otherCosts: 0, minMarkup: 1, allocationMode: "daily",
    }),
    roiClient: JSON.stringify({
      roiValidated: false, weeklyHours: 0, roiPeople: 1, hourlyCost: 0, automationRate: 0,
      realizationRate: 0, errorsAvoided: 0, errorCost: 0, toolSavings: 0, additionalRevenue: 0,
      contributionMargin: 0, fteHours: 1820, activeWeeks: 52,
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    publishedOffer: null,
    ...overrides,
  };
}

describe("P1 — offer integrity: a published offer is frozen at publish time", () => {
  beforeEach(() => {
    vi.mocked(prisma.demande.findUnique).mockReset();
    vi.mocked(prisma.demande.update).mockReset();
  });

  it("publishDemande() persists a sanitized snapshot alongside the status change", async () => {
    const demande = makeDemande();
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(demande);
    vi.mocked(prisma.demande.update).mockImplementation((({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...demande, ...data })) as never);

    await publishDemande(demande.id);

    const call = vi.mocked(prisma.demande.update).mock.calls[0][0];
    expect(call.data).toMatchObject({ status: "accepted" });
    expect(typeof (call.data as { publishedOffer?: string }).publishedOffer).toBe("string");
    const snapshot = JSON.parse((call.data as { publishedOffer: string }).publishedOffer);
    expect(snapshot.commercial_price).toBe(2560); // MTMT calibration (engine.test.ts TC-04)
    expect(snapshot).not.toHaveProperty("floor_price");
    expect(snapshot).not.toHaveProperty("gate");
  });

  it("a later catalog/price change never alters an already-published offer", async () => {
    const published = makeDemande({
      status: "accepted",
      publishedAt: new Date("2026-01-01"),
      publishedOffer: JSON.stringify({
        company_name: "MTMT",
        project_name: "Refonte",
        pack: "GROW",
        commercial_price: 2560,
        maintenance_year1_monthly: 200,
        delivery_days: 5,
        delivery_confidence: "Moyenne",
        modules: ["site_premium", "dir_cockpit", "plan_booking"],
        domains: ["Direction & Pilotage", "Site / Portail digital", "Planning & Réservation"],
      }),
      // Simulates the row having drifted after publication (e.g. an admin readjustment,
      // or — once the catalogue is editable — a later module price change): the frozen
      // publishedOffer must win regardless of what these fields say now.
      selectedModules: JSON.stringify(["site_premium"]),
      pricing: JSON.stringify({ discountRate: 0, productiveDays: 20, deliveryConfidence: "Moyenne" }),
    });
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(published);

    const offer = await getPublishedOfferByToken(published.publicToken);

    expect(offer?.commercial_price).toBe(2560);
    expect(offer?.modules).toEqual(["site_premium", "dir_cockpit", "plan_booking"]);
    expect(vi.mocked(prisma.demande.update)).not.toHaveBeenCalled();
  });

  it("backfills a snapshot exactly once for a demande published before this mechanism existed", async () => {
    const legacy = makeDemande({ status: "accepted", publishedAt: new Date("2026-01-01"), publishedOffer: null });
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(legacy);
    vi.mocked(prisma.demande.update).mockResolvedValue(legacy);

    const offer = await getPublishedOfferByToken(legacy.publicToken);

    expect(offer?.commercial_price).toBe(2560);
    expect(vi.mocked(prisma.demande.update)).toHaveBeenCalledTimes(1);
    const call = vi.mocked(prisma.demande.update).mock.calls[0][0];
    expect(typeof (call.data as { publishedOffer: string }).publishedOffer).toBe("string");
  });

  it("never publishes internal ROI ADAI fields in the snapshot", async () => {
    const demande = makeDemande();
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(demande);
    vi.mocked(prisma.demande.update).mockImplementation((({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...demande, ...data })) as never);

    await publishDemande(demande.id);

    const call = vi.mocked(prisma.demande.update).mock.calls[0][0];
    const raw = (call.data as { publishedOffer: string }).publishedOffer;
    for (const forbidden of ["project_cost", "floor_price", "markup", "gross_profit", "gross_margin", "resourcePool"]) {
      expect(raw).not.toContain(forbidden);
    }
  });
});
