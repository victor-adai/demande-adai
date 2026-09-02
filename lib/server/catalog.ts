import { prisma } from "@/lib/prisma";
import { DOMAINS, defaultCatalogDomains, type CatalogDomain } from "@/lib/data";

// The technical ids are immutable and code-defined — this is the allow-list the catalogue
// PUT route validates against, so a request can never invent, rename, or remove a module id.
export const KNOWN_MODULE_IDS = new Set(DOMAINS.flatMap((d) => d.mods.map((m) => m.id)));

// Single canonical read path for the admin-editable commercial catalogue (module
// name/build/maint/active). Domain grouping and module descriptions are NOT stored in DB —
// they stay code-defined (lib/data.ts), out of V1's editable scope, so there is never a
// second live copy of them either. Every consumer (engine calls, both server and client
// screens, the admin catalogue editor) must go through this function; DOMAINS itself is
// never read directly for pricing outside of this file and prisma/seed.ts.
export async function getCatalog(): Promise<{ domains: CatalogDomain[] }> {
  const rows = await prisma.catalogModule.findMany();
  if (rows.length === 0) {
    // Fresh/unseeded DB (e.g. first boot before `pnpm db:seed`) — bootstrap fallback only,
    // not a second source of truth for ongoing operation.
    return { domains: defaultCatalogDomains() };
  }

  const byId = new Map(rows.map((r) => [r.moduleId, r]));
  return {
    domains: DOMAINS.map((domain) => ({
      ...domain,
      mods: domain.mods.map((mod) => {
        const row = byId.get(mod.id);
        return row
          ? { id: mod.id, name: row.name, desc: mod.desc, build: row.build, maint: row.maint, active: row.active }
          : { ...mod, active: true }; // code added a module id not yet seeded — shouldn't happen post-seed
      }),
    })),
  };
}
