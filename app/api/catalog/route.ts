import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCatalog, KNOWN_MODULE_IDS } from "@/lib/server/catalog";

// V1 editable scope only: label, BUILD price, maintenance, active flag. moduleId is the
// immutable technical id (validated against the code-defined catalogue below) — this route
// can never create a new module row (no upsert) nor delete one (no DELETE handler at all),
// only update() an existing one. Deactivation (active:false) is the only supported removal
// path, preserving history for demandes that already reference the module.
const CatalogUpdateSchema = z.object({
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
    .min(1),
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

  const unknownIds = parsed.data.modules.map((m) => m.moduleId).filter((id) => !KNOWN_MODULE_IDS.has(id));
  if (unknownIds.length > 0) {
    return NextResponse.json({ error: "UNKNOWN_MODULE_ID", moduleIds: unknownIds }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.modules.map((m) =>
      prisma.catalogModule.update({
        where: { moduleId: m.moduleId },
        data: { name: m.name, build: m.build, maint: m.maint, active: m.active },
      })
    )
  );

  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}
