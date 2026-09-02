// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    catalogModule: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    catalogPack: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getCatalog, KNOWN_MODULE_IDS, KNOWN_PACK_KEYS } from "@/lib/server/catalog";
import { DOMAINS, PACKS } from "@/lib/data";
import { GET, PUT } from "@/app/api/catalog/route";

const mockedGetServerSession = vi.mocked(getServerSession);

describe("getCatalog() — single canonical source for module commercial data", () => {
  beforeEach(() => {
    vi.mocked(prisma.catalogModule.findMany).mockReset();
    vi.mocked(prisma.catalogPack.findMany).mockReset().mockResolvedValue([]);
  });

  it("falls back to the seed catalogue (all active) when the DB table is empty", async () => {
    vi.mocked(prisma.catalogModule.findMany).mockResolvedValue([]);
    const catalog = await getCatalog();

    const totalModules = catalog.domains.reduce((n, d) => n + d.mods.length, 0);
    const expectedTotal = DOMAINS.reduce((n, d) => n + d.mods.length, 0);
    expect(totalModules).toBe(expectedTotal);
    expect(catalog.domains.every((d) => d.mods.every((m) => m.active === true))).toBe(true);

    const site = catalog.domains.flatMap((d) => d.mods).find((m) => m.id === "site_premium");
    expect(site?.build).toBe(1200); // matches lib/data.ts seed value
  });

  it("overlays DB values (name/build/maint/active) onto the code-defined structure", async () => {
    vi.mocked(prisma.catalogModule.findMany).mockResolvedValue([
      { moduleId: "site_premium", name: "Site vitrine premium (V2)", build: 1500, maint: 50, active: true, updatedAt: new Date() },
      { moduleId: "com_meta", name: "Pack Meta + WhatsApp + Google Business", build: 800, maint: 0, active: false, updatedAt: new Date() },
    ] as never);

    const catalog = await getCatalog();
    const mods = catalog.domains.flatMap((d) => d.mods);

    const site = mods.find((m) => m.id === "site_premium");
    expect(site).toMatchObject({ name: "Site vitrine premium (V2)", build: 1500, maint: 50, active: true });

    const meta = mods.find((m) => m.id === "com_meta");
    expect(meta?.active).toBe(false);

    // A module not present in the (partial) DB result still resolves, defaulting to active.
    const untouched = mods.find((m) => m.id === "crm_prospects");
    expect(untouched).toMatchObject({ build: 500, maint: 30, active: true });

    // Domain grouping/description are never sourced from the DB — no second copy of them.
    const domain = catalog.domains.find((d) => d.key === "crm");
    expect(domain?.desc).toBe(DOMAINS.find((d) => d.key === "crm")!.desc);
  });

  it("falls back to the seed pack prices when the CatalogPack table is empty", async () => {
    vi.mocked(prisma.catalogModule.findMany).mockResolvedValue([]);
    vi.mocked(prisma.catalogPack.findMany).mockResolvedValue([]);
    const catalog = await getCatalog();

    expect(catalog.packs.grow).toMatchObject({ label: "GROW", base: PACKS.grow.base, maint: PACKS.grow.maint });
    // baseDays (delivery timing) is never DB-editable — always the code-defined engine rule.
    expect(catalog.packs.grow.baseDays).toEqual(PACKS.grow.baseDays);
  });

  it("overlays DB base/maintenance onto a pack, leaving label/baseDays code-defined", async () => {
    vi.mocked(prisma.catalogModule.findMany).mockResolvedValue([]);
    vi.mocked(prisma.catalogPack.findMany).mockResolvedValue([
      { packKey: "grow", base: 5200, maint: 400, updatedAt: new Date() },
    ] as never);

    const catalog = await getCatalog();
    expect(catalog.packs.grow.base).toBe(5200);
    expect(catalog.packs.grow.maint).toBe(400);
    expect(catalog.packs.grow.label).toBe("GROW");
    expect(catalog.packs.grow.baseDays).toEqual(PACKS.grow.baseDays);
    // A pack not present in the (partial) DB result still resolves to the seed values.
    expect(catalog.packs.start).toMatchObject({ base: PACKS.start.base, maint: PACKS.start.maint });
  });
});

describe("GET/PUT /api/catalog — auth, immutability, no physical deletion", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    vi.mocked(prisma.catalogModule.findMany).mockReset().mockResolvedValue([]);
    vi.mocked(prisma.catalogModule.update).mockReset();
    vi.mocked(prisma.catalogPack.findMany).mockReset().mockResolvedValue([]);
    vi.mocked(prisma.catalogPack.update).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
  });

  it("GET returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("PUT returns 401 without a session", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/catalog", { method: "PUT", body: JSON.stringify({ modules: [] }) });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("rejects an unknown/invented moduleId (technical ids are immutable) without writing anything", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    const req = new NextRequest("http://localhost/api/catalog", {
      method: "PUT",
      body: JSON.stringify({ modules: [{ moduleId: "not_a_real_module", name: "x", build: 1, maint: 1, active: true }] }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("UNKNOWN_MODULE_ID");
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
  });

  it("updates existing rows only — never creates a new row (no upsert, no create)", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);
    vi.mocked(prisma.catalogModule.findMany).mockResolvedValue([]);

    const moduleId = Array.from(KNOWN_MODULE_IDS)[0];
    const req = new NextRequest("http://localhost/api/catalog", {
      method: "PUT",
      body: JSON.stringify({ modules: [{ moduleId, name: "Nouveau libellé", build: 999, maint: 42, active: false }] }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalledTimes(1);
    // catalogModule.update (not create/upsert) is the only write primitive ever invoked here —
    // `create` isn't even defined on the mocked model, so calling it would throw synchronously.
    expect(vi.mocked(prisma.catalogModule.update)).toHaveBeenCalledWith({
      where: { moduleId },
      data: { name: "Nouveau libellé", build: 999, maint: 42, active: false },
    });
  });

  it("deactivation (active:false) is the only supported removal — there is no DELETE handler", async () => {
    const routeModule = await import("@/app/api/catalog/route");
    expect((routeModule as unknown as { DELETE?: unknown }).DELETE).toBeUndefined();
  });

  it("rejects an unknown/invented packKey without writing anything", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    const req = new NextRequest("http://localhost/api/catalog", {
      method: "PUT",
      body: JSON.stringify({ packs: [{ packKey: "enterprise", base: 1, maint: 1 }] }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("UNKNOWN_PACK_KEY");
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
  });

  it("updates an existing pack row (base/maintenance only — label/baseDays untouched)", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    const packKey = Array.from(KNOWN_PACK_KEYS)[0];
    const req = new NextRequest("http://localhost/api/catalog", {
      method: "PUT",
      body: JSON.stringify({ packs: [{ packKey, base: 5200, maint: 400 }] }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.catalogPack.update)).toHaveBeenCalledWith({
      where: { packKey },
      data: { base: 5200, maint: 400 },
    });
  });

  it("rejects an empty payload (neither modules nor packs)", async () => {
    mockedGetServerSession.mockResolvedValue({ user: { email: "admin@adai.local" } } as never);
    const req = new NextRequest("http://localhost/api/catalog", { method: "PUT", body: JSON.stringify({}) });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
