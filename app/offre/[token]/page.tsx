import { notFound } from "next/navigation";
import { getPublishedOfferByToken } from "@/lib/server/demandes";
import { getCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export default async function PublicOfferPage({ params }: { params: { token: string } }) {
  // domains is only consulted by getPublishedOfferByToken() for the legacy backfill path
  // (a demande published before the snapshot mechanism existed) — every offer published
  // since then is served straight from its frozen publishedOffer, unaffected by the catalogue.
  const catalog = await getCatalog();
  const offer = await getPublishedOfferByToken(params.token, catalog.domains);
  if (!offer) notFound();

  return (
    <main className="section" style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px" }}>
      <div className="card summary">
        <div className="summaryTop">
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{offer.company_name || "Votre offre ADAI"}</h1>
            <small>{offer.project_name}</small>
          </div>
          <span className="chip">{offer.pack}</span>
        </div>

        <div className="summaryPrice">{Math.round(offer.commercial_price).toLocaleString("fr-FR")} €</div>

        <div className="row">
          <span>Maintenance</span>
          <b>{Math.round(offer.maintenance_year1_monthly).toLocaleString("fr-FR")} €/mois</b>
        </div>
        <div className="row">
          <span>Délai estimé</span>
          <b>{offer.delivery_days} jours ({offer.delivery_confidence})</b>
        </div>
        <div className="row">
          <span>Domaines couverts</span>
          <b>{offer.domains.join(", ") || "—"}</b>
        </div>
        <div className="row">
          <span>Modules inclus</span>
          <b>{offer.modules.length}</b>
        </div>
        <div className="row">
          <span>Publiée le</span>
          <b>{new Date(offer.published_at).toLocaleDateString("fr-FR")}</b>
        </div>
      </div>
    </main>
  );
}
