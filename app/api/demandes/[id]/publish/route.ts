import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDemande, demandeToResult, publishDemande } from "@/lib/server/demandes";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const demande = await getDemande(params.id);
  if (!demande) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const force = body?.force === true;

  const result = demandeToResult(demande);
  if (!result.gate && !force) {
    return NextResponse.json(
      {
        error: "GATE_FAILED",
        message: "Le gate ROI ADAI n'autorise pas la publication de cette offre en l'état.",
      },
      { status: 409 }
    );
  }

  const published = await publishDemande(params.id);
  return NextResponse.json({ id: published!.id, publicToken: published!.publicToken, status: published!.status });
}
