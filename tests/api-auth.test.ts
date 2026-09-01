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
import { GET as getDemandes, POST as postDemande } from "@/app/api/demandes/route";
import { GET as getDemande, PATCH as patchDemande } from "@/app/api/demandes/[id]/route";
import { POST as publishDemande } from "@/app/api/demandes/[id]/publish/route";
import { GET as getRoiSettings, PUT as putRoiSettings } from "@/app/api/roi-settings/route";

const mockedGetServerSession = vi.mocked(getServerSession);

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
