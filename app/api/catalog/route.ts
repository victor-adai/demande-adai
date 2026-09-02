import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCatalog, KNOWN_MODULE_IDS, KNOWN_PACK_KEYS } from "@/lib/server/catalog";

// V1 editable scope only: modules (label, BUILD price, maintenance, active flag) and packs
// (base price, maintenance — label/baseDays stay code-defined, they're forcing/engine rules).
// moduleId/packKey are immutable technical ids (validated against the code-defined catalogue
// below) — this route can never create a new row (no upsert) nor delete one (no DELETE
// handler at all), only update() existing ones. Deactivation (active:false) is the only
// supported module removal path, preserving history for demandes that already reference it.
const CatalogUpdateSchema = z
  .object({
    modules: z
      .array(
        z.object({
          moduleId: z.string(),
          name: z.string().trim().min(1),
          build: z.number().nonnegative(),
          maint: z.number().nonnegative(),
          active: z.boolean(),
        })
      )
      .optional(),
    packs: z
      .array(
        z.object({
          packKey: z.string(),
          base: z.number().nonnegative(),
          maint: z.number().nonnegative(),
        })
      )
      .optional(),
  })
  .refine((d) => (d.modules?.length ?? 0) + (d.packs?.length ?? 0) > 0, {
    message: "Nothing to update",
  });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CatalogUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const modules = parsed.data.modules ?? [];
  const packs = parsed.data.packs ?? [];

  const unknownIds = modules.map((m) => m.moduleId).filter((id) => !KNOWN_MODULE_IDS.has(id));
  if (unknownIds.length > 0) {
    return NextResponse.json({ error: "UNKNOWN_MODULE_ID", moduleIds: unknownIds }, { status: 400 });
  }

  const unknownPackKeys = packs.map((p) => p.packKey).filter((key) => !KNOWN_PACK_KEYS.has(key as never));
  if (unknownPackKeys.length > 0) {
    return NextResponse.json({ error: "UNKNOWN_PACK_KEY", packKeys: unknownPackKeys }, { status: 400 });
  }

  await prisma.$transaction([
    ...modules.map((m) =>
      prisma.catalogModule.update({
        where: { moduleId: m.moduleId },
        data: { name: m.name, build: m.build, maint: m.maint, active: m.active },
      })
    ),
    ...packs.map((p) =>
      prisma.catalogPack.update({
        where: { packKey: p.packKey },
        data: { base: p.base, maint: p.maint },
      })
    ),
  ]);

  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}
