// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    demande: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: "demo-id", publicToken: "demo-token" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    roiSettings: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET as getDemandes, POST as postDemande } from "@/app/api/demandes/route";
import { GET as getDemande, PATCH as patchDemande } from "@/app/api/demandes/[id]/route";
import { POST as publishDemande } from "@/app/api/demandes/[id]/publish/route";
import { GET as getRoiSettings, PUT as putRoiSettings } from "@/app/api/roi-settings/route";

const mockedGetServerSession = vi.mocked(getServerSession);

function makeDemande(overrides: {
  currentPack: string;
  selectedModules: string[];
  discountRate?: number;
  deliveryMode?: string;
}) {
  const base = {
    id: "demo-id",
    publicToken: "demo-token",
    status: "submitted",
    currentPack: overrides.currentPack,
    selectedModules: JSON.stringify(overrides.selectedModules),
    client: JSON.stringify({
      companyName: "Test", projectName: "Test", industry: "", subIndustry: "",
      revenue: "< 100 k€", companySize: "1–10", impactedPeople: "1–3", solutionUsers: "1–10",
      organization: "Mono-site / 1 entité", siteCount: 1, entityCount: 1, countries: "1 pays",
      digitalMaturity: "Faible", itCapacity: "Aucune", priority: "Faible", timeline: "< 1 mois",
      budget: "Non communiqué", currentTools: "", painPoints: "",
    }),
    need: JSON.stringify({
      description: "", currentProcess: "Majoritairement manuel", migration: "Aucune / légère",
      customization: "Standard", sensitive: "Non", roles: "1 rôle", deliveryMode: overrides.deliveryMode ?? "SCRATCH",
      integrationCount: 0, volume: "Faible",
    }),
    pricing: JSON.stringify({
      discountRate: overrides.discountRate ?? 0, productiveDays: 20, deliveryConfidence: "Moyenne",
    }),
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
  };
  return base;
}

describe("BO-04 / BO-09 — Admin API routes require an authenticated session", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
  });

  it("GET /api/demandes returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await getDemandes(new NextRequest("http://localhost/api/demandes"));
    expect(res.status).toBe(401);
  });

  it("GET /api/demandes returns 200 with a session", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    const res = await getDemandes(new NextRequest("http://localhost/api/demandes"));
    expect(res.status).toBe(200);
  });

  it("GET /api/demandes/[id] returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await getDemande(new NextRequest("http://localhost/api/demandes/x"), { params: { id: "x" } });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/demandes/[id] returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/demandes/x", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await patchDemande(req, { params: { id: "x" } });
    expect(res.status).toBe(401);
  });

  it("POST /api/demandes/[id]/publish returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/demandes/x/publish", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await publishDemande(req, { params: { id: "x" } });
    expect(res.status).toBe(401);
  });

  it("GET /api/roi-settings returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await getRoiSettings();
    expect(res.status).toBe(401);
  });

  it("PUT /api/roi-settings returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/roi-settings", {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const res = await putRoiSettings(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/demandes (public client submission) never requires a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/demandes", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await postDemande(req);
    // Rejected for invalid payload (400), never for missing auth (401) — this endpoint is public.
    expect(res.status).not.toBe(401);
  });
});

describe("BO-PACK / BO-DISCOUNT — publish route enforces the guard, no override", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    vi.mocked(prisma.demande.findUnique).mockReset();
    vi.mocked(prisma.demande.update).mockReset();
  });

  it("blocks publish with 409 CONFIGURATION_INCONSISTENT when pack is below required minimum", async () => {
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(
      makeDemande({ currentPack: "start", selectedModules: ["data_advanced"] }) as never
    );
    const req = new NextRequest("http://localhost/api/demandes/x/publish", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await publishDemande(req, { params: { id: "x" } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("CONFIGURATION_INCONSISTENT");
    expect(vi.mocked(prisma.demande.update)).not.toHaveBeenCalled();
  });

  it("force=true does NOT bypass the pack/discount guard (no override mechanism)", async () => {
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(
      makeDemande({ currentPack: "start", selectedModules: ["data_advanced"] }) as never
    );
    const req = new NextRequest("http://localhost/api/demandes/x/publish", {
      method: "POST",
      body: JSON.stringify({ force: true }),
    });
    const res = await publishDemande(req, { params: { id: "x" } });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("CONFIGURATION_INCONSISTENT");
  });

  it("allows publish when pack is consistent and gate passes", async () => {
    // MTMT-equivalent scope (see tests/engine.test.ts TC-04): catalog 3200, commercial 2560
    // after 20% discount, gate GO. None of these modules force GROW/SCALE, so a GROW pack
    // selection is self-consistent.
    vi.mocked(prisma.demande.findUnique).mockResolvedValue(
      makeDemande({
        currentPack: "grow",
        selectedModules: ["site_premium", "dir_cockpit", "plan_booking"],
        discountRate: 0.2,
        deliveryMode: "SAAS_ADAPT",
      }) as never
    );
    vi.mocked(prisma.demande.update).mockResolvedValue({
      id: "x",
      publicToken: "demo-token",
      status: "accepted",
    } as never);
    const req = new NextRequest("http://localhost/api/demandes/x/publish", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await publishDemande(req, { params: { id: "x" } });
    expect(res.status).toBe(200);
  });
});
