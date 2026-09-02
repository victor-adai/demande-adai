import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReadjustDemandeSchema } from "@/lib/server/demande-schema";
import { getDemande, demandeToPayload, readjustDemande } from "@/lib/server/demandes";
import { getCatalog } from "@/lib/server/catalog";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const demande = await getDemande(params.id);
  if (!demande) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const catalog = await getCatalog();
  return NextResponse.json({
    id: demande.id,
    status: demande.status,
    publicToken: demande.publicToken,
    publishedAt: demande.publishedAt,
    createdAt: demande.createdAt,
    updatedAt: demande.updatedAt,
    payload: demandeToPayload(demande, catalog.domains),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ReadjustDemandeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await readjustDemande(params.id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const catalog = await getCatalog();
  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    payload: demandeToPayload(updated, catalog.domains),
  });
}
