import { notFound } from "next/navigation";
import { getDemande, demandeToPayload, demandeToBuilderState } from "@/lib/server/demandes";
import { getCatalog } from "@/lib/server/catalog";
import ReadjustPanel from "./readjust-panel";

export const dynamic = "force-dynamic";

export default async function DemandeDetailPage({ params }: { params: { id: string } }) {
  const demande = await getDemande(params.id);
  if (!demande) notFound();

  const catalog = await getCatalog();
  const payload = demandeToPayload(demande, catalog.domains, catalog.packs);
  const state = demandeToBuilderState(demande);
  const publicUrl = demande.publishedAt ? `/offre/${demande.publicToken}` : null;

  return (
    <div className="admin-detail-grid">
      <section className="admin-card">
        <h2>1 — Qualification</h2>
        <Field label="Entreprise" value={payload.client.companyName || "—"} />
        <Field label="Projet" value={payload.client.projectName || "—"} />
        <Field label="Secteur" value={payload.client.industry || "—"} />
        <Field label="Taille" value={payload.client.company_size} />
        <Field label="Organisation" value={payload.client.organization_type} />
        <Field label="Pays" value={payload.client.country_scope} />
        <Field label="Maturité digitale" value={payload.client.digital_maturity} />
        <Field label="Description besoin" value={payload.need.description || "—"} />
        <Field label="Migration" value={payload.need.migration} />
        <Field label="Personnalisation" value={payload.need.customization} />
        <Field label="Données sensibles" value={payload.need.sensitive_data} />
        <Field label="Intégrations" value={String(payload.need.integration_count)} />
        <Field label="Domaines actifs" value={payload.scope.domains.join(", ") || "—"} />
        <Field label="Modules sélectionnés" value={String(payload.scope.modules.length)} />
      </section>

      <section className="admin-card">
        <span className="admin-confidential">Confidentiel · Interne ADAI</span>
        <h2>2 — Pricing &amp; ROI ADAI</h2>
        <Field label="Pack retenu (forcé)" value={payload.pricing.pack} />
        <Field label="Valeur fonctionnelle" value={euro(payload.pricing.functional_value)} />
        <Field label="Ajustement complexité" value={euro(payload.pricing.complexity_adjustment)} />
        <Field label="Valeur catalogue" value={euro(payload.pricing.catalog_value)} />
        <Field label="Prix commercial" value={euro(payload.pricing.commercial_price)} />
        <Field label="Maintenance an 1" value={`${euro(payload.pricing.maintenance_year1_monthly)}/mois`} />
        <Field label="Délai estimé" value={`${payload.delivery.estimated_days} j`} />
        <Field label="Coût projet ADAI" value={euro(payload.roi_adai.project_cost)} />
        <Field label="Prix plancher (floor)" value={euro(payload.roi_adai.floor_price)} />
        <Field label="Markup" value={pct(payload.roi_adai.markup_percent)} />
        <Field label="Marge brute" value={euro(payload.roi_adai.gross_profit)} />
        <Field label="Marge brute %" value={pct(payload.roi_adai.gross_margin_percent)} />
        <Field label="Remise max autorisée" value={pct(payload.roi_adai.max_discount_rate)} />
        <Field
          label="Gate GO/NO-GO"
          value={payload.roi_adai.gate ? "GO" : "NO-GO"}
        />
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
        <Field label="ROI client — statut" value={state.roiClient.roiValidated ? "Validé" : "En attente de validation"} />
        <Field
          label="ROI client %"
          value={state.roiClient.roiValidated ? pct(payload.roi_client.roi_percent ?? 0) : "Masqué (non validé)"}
        />
      </section>

      <section className="admin-card">
        <h2>3 — Réajustement</h2>
        <ReadjustPanel
          demandeId={demande.id}
          domains={catalog.domains}
          packs={catalog.packs}
          client={state.client}
          need={state.need}
          roiAdai={state.roiAdai}
          pricing={state.pricing}
          roiClient={state.roiClient}
          initialPack={state.currentPack}
          initialModules={Array.from(state.selectedModules)}
          initialDiscountRate={state.pricing.discountRate}
          initialRoiValidated={state.roiClient.roiValidated}
          gate={payload.roi_adai.gate}
          status={demande.status}
          publicUrl={publicUrl}
        />
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-field-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function euro(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function pct(n: number): string {
  return `${(Math.round(n * 10) / 10).toLocaleString("fr-FR")} %`;
}
