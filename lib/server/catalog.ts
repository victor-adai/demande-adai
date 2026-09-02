import { prisma } from "@/lib/prisma";
import { DOMAINS, PACKS, defaultCatalogDomains, type CatalogDomain, type Pack, type PackKey } from "@/lib/data";

// The technical ids are immutable and code-defined — this is the allow-list the catalogue
// PUT route validates against, so a request can never invent, rename, or remove a module id.
export const KNOWN_MODULE_IDS = new Set(DOMAINS.flatMap((d) => d.mods.map((m) => m.id)));
export const KNOWN_PACK_KEYS = new Set(Object.keys(PACKS) as PackKey[]);

// Single canonical read path for the admin-editable commercial catalogue (module
// name/build/maint/active, pack base/maintenance). Domain grouping, module descriptions,
// and pack label/baseDays (delivery timing — a forcing/engine rule) are NOT stored in DB —
// they stay code-defined (lib/data.ts), out of V1's editable scope, so there is never a
// second live copy of them either. Every consumer (engine calls, both server and client
// screens, the admin catalogue editor) must go through this function; DOMAINS/PACKS
// themselves are never read directly for pricing outside of this file and prisma/seed.ts.
export async function getCatalog(): Promise<{ domains: CatalogDomain[]; packs: Record<PackKey, Pack> }> {
  const [moduleRows, packRows] = await Promise.all([
    prisma.catalogModule.findMany(),
    prisma.catalogPack.findMany(),
  ]);

  let domains: CatalogDomain[];
  if (moduleRows.length === 0) {
    // Fresh/unseeded DB (e.g. first boot before `pnpm db:seed`) — bootstrap fallback only,
    // not a second source of truth for ongoing operation.
    domains = defaultCatalogDomains();
  } else {
    const byId = new Map(moduleRows.map((r) => [r.moduleId, r]));
    domains = DOMAINS.map((domain) => ({
      ...domain,
      mods: domain.mods.map((mod) => {
        const row = byId.get(mod.id);
        return row
          ? { id: mod.id, name: row.name, desc: mod.desc, build: row.build, maint: row.maint, active: row.active }
          : { ...mod, active: true }; // code added a module id not yet seeded — shouldn't happen post-seed
      }),
    }));
  }

  const packById = new Map(packRows.map((r) => [r.packKey, r]));
  const packs = Object.fromEntries(
    (Object.keys(PACKS) as PackKey[]).map((key) => {
      const row = packById.get(key);
      return [key, row ? { ...PACKS[key], base: row.base, maint: row.maint } : PACKS[key]];
    })
  ) as Record<PackKey, Pack>;

  return { domains, packs };
}
