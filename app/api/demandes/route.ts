import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateDemandeSchema } from "@/lib/server/demande-schema";
import { createDemande, listDemandes, type DemandeStatus } from "@/lib/server/demandes";

const STATUSES = ["submitted", "adjusted", "accepted", "rejected"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = statusParam && STATUSES.includes(statusParam) ? (statusParam as DemandeStatus) : undefined;

  const result = await listDemandes({
    search: searchParams.get("search") ?? undefined,
    status,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateDemandeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const demande = await createDemande(parsed.data);
  return NextResponse.json({ id: demande.id, publicToken: demande.publicToken }, { status: 201 });
}
