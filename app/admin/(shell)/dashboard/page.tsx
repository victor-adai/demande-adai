import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { demandeToResult } from "@/lib/server/demandes";
import { getCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

const STATUS_KEYS: Record<string, string> = {
  submitted: "statusSubmitted",
  adjusted: "statusAdjusted",
  accepted: "statusAccepted",
  rejected: "statusRejected",
};

export default async function DashboardPage() {
  const [demandes, catalog, t, tStatus] = await Promise.all([
    prisma.demande.findMany({ orderBy: { createdAt: "desc" } }),
    getCatalog(),
    getTranslations("AdminDashboard"),
    getTranslations("AdminDemandesList"),
  ]);

  const total = demandes.length;
  const aTraiter = demandes.filter((d) => d.status === "submitted").length;
  const acceptees = demandes.filter((d) => d.status === "accepted").length;
  const valeurCommerciale = demandes.reduce(
    (sum, d) => sum + demandeToResult(d, catalog.domains, catalog.packs).commercialPrice,
    0
  );

  const byStatus = ["submitted", "adjusted", "accepted", "rejected"].map((status) => ({
    status,
    count: demandes.filter((d) => d.status === status).length,
  }));

  if (total === 0) {
    return (
      <>
        <div className="admin-metric-grid">
          <div className="admin-metric">
            <div className="label">{t("demandes")}</div>
            <div className="value">0</div>
          </div>
        </div>
        <div className="admin-empty">{t("empty")}</div>
        <QuickLinks />
      </>
    );
  }

  return (
    <>
      <div className="admin-metric-grid">
        <div className="admin-metric">
          <div className="label">{t("demandes")}</div>
          <div className="value">{total}</div>
        </div>
        <div className="admin-metric">
          <div className="label">{t("aTraiter")}</div>
          <div className="value">{aTraiter}</div>
        </div>
        <div className="admin-metric">
          <div className="label">{t("acceptees")}</div>
          <div className="value">{acceptees}</div>
        </div>
        <div className="admin-metric">
          <div className="label">{t("valeurCommerciale")}</div>
          <div className="value">{Math.round(valeurCommerciale).toLocaleString("fr-FR")} €</div>
        </div>
      </div>

      <div className="admin-card">
        <h2>{t("repartitionParStatut")}</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("statut")}</th>
              <th>{t("nombre")}</th>
            </tr>
          </thead>
          <tbody>
            {byStatus.map((s) => (
              <tr key={s.status}>
                <td>
                  <span className={`admin-badge ${s.status}`}>{tStatus(STATUS_KEYS[s.status])}</span>
                </td>
                <td>{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h2>{t("tendance")}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("tendanceEmpty")}</p>
      </div>

      <QuickLinks />
    </>
  );
}

async function QuickLinks() {
  const t = await getTranslations("AdminDashboard");
  const tNav = await getTranslations("AdminNav");
  return (
    <div className="admin-card">
      <h2>{t("accesRapide")}</h2>
      <div style={{ display: "flex", gap: 12 }}>
        <Link className="admin-btn secondary" href="/admin/demandes">
          {tNav("demandes")}
        </Link>
        <Link className="admin-btn secondary" href="/admin/catalogue">
          {tNav("catalogue")}
        </Link>
        <Link className="admin-btn secondary" href="/admin/parametres">
          {tNav("parametres")}
        </Link>
      </div>
    </div>
  );
}
