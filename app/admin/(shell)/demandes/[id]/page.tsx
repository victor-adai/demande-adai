import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDemande, demandeToPayload, demandeToBuilderState } from "@/lib/server/demandes";
import { getCatalog } from "@/lib/server/catalog";
import ReadjustPanel from "./readjust-panel";

export const dynamic = "force-dynamic";

export default async function DemandeDetailPage({ params }: { params: { id: string } }) {
  const demande = await getDemande(params.id);
  if (!demande) notFound();

  const t = await getTranslations("AdminDemandeDetail");
  const catalog = await getCatalog();
  const payload = demandeToPayload(demande, catalog.domains, catalog.packs);
  const state = demandeToBuilderState(demande);
  const publicUrl = demande.publishedAt ? `/offre/${demande.publicToken}` : null;

  return (
    <div className="admin-detail-grid">
      <section className="admin-card">
        <h2>{t("section1")}</h2>
        <Field label={t("entreprise")} value={payload.client.companyName || "—"} />
        <Field label={t("projet")} value={payload.client.projectName || "—"} />
        <Field label={t("secteur")} value={payload.client.industry || "—"} />
        <Field label={t("taille")} value={payload.client.company_size} />
        <Field label={t("organisation")} value={payload.client.organization_type} />
        <Field label={t("pays")} value={payload.client.country_scope} />
        <Field label={t("maturiteDigitale")} value={payload.client.digital_maturity} />
        <Field label={t("descriptionBesoin")} value={payload.need.description || "—"} />
        <Field label={t("migration")} value={payload.need.migration} />
        <Field label={t("personnalisation")} value={payload.need.customization} />
        <Field label={t("donneesSensibles")} value={payload.need.sensitive_data} />
        <Field label={t("integrations")} value={String(payload.need.integration_count)} />
        <Field label={t("domainesActifs")} value={payload.scope.domains.join(", ") || "—"} />
        <Field label={t("modulesSelectionnes")} value={String(payload.scope.modules.length)} />
      </section>

      <section className="admin-card">
        <span className="admin-confidential">{t("confidentiel")}</span>
        <h2>{t("section2")}</h2>
        <Field label={t("packRetenu")} value={payload.pricing.pack} />
        <Field label={t("valeurFonctionnelle")} value={euro(payload.pricing.functional_value)} />
        <Field label={t("ajustementComplexite")} value={euro(payload.pricing.complexity_adjustment)} />
        <Field label={t("valeurCatalogue")} value={euro(payload.pricing.catalog_value)} />
        <Field label={t("prixCommercial")} value={euro(payload.pricing.commercial_price)} />
        <Field label={t("maintenanceAn1")} value={`${euro(payload.pricing.maintenance_year1_monthly)}/mois`} />
        <Field label={t("delaiEstime")} value={`${payload.delivery.estimated_days} j`} />
        <Field label={t("coutProjetAdai")} value={euro(payload.roi_adai.project_cost)} />
        <Field label={t("prixPlancher")} value={euro(payload.roi_adai.floor_price)} />
        <Field label={t("markup")} value={pct(payload.roi_adai.markup_percent)} />
        <Field label={t("margeBrute")} value={euro(payload.roi_adai.gross_profit)} />
        <Field label={t("margeBrutePct")} value={pct(payload.roi_adai.gross_margin_percent)} />
        <Field label={t("remiseMax")} value={pct(payload.roi_adai.max_discount_rate)} />
        <Field
          label={t("gate")}
          value={payload.roi_adai.gate ? "GO" : "NO-GO"}
        />
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
        <Field label={t("roiClientStatut")} value={state.roiClient.roiValidated ? t("valide") : t("enAttenteValidation")} />
        <Field
          label={t("roiClientPct")}
          value={state.roiClient.roiValidated ? pct(payload.roi_client.roi_percent ?? 0) : t("masqueNonValide")}
        />
      </section>

      <section className="admin-card">
        <h2>{t("section3")}</h2>
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
