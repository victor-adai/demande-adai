import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { demandeToResult } from "@/lib/server/demandes";
import { getCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [demandes, catalog] = await Promise.all([
    prisma.demande.findMany({ orderBy: { createdAt: "desc" } }),
    getCatalog(),
  ]);

  const total = demandes.length;
  const aTraiter = demandes.filter((d) => d.status === "submitted").length;
  const acceptees = demandes.filter((d) => d.status === "accepted").length;
  const valeurCommerciale = demandes.reduce((sum, d) => sum + demandeToResult(d, catalog.domains).commercialPrice, 0);

  const byStatus = ["submitted", "adjusted", "accepted", "rejected"].map((status) => ({
    status,
    count: demandes.filter((d) => d.status === status).length,
  }));

  if (total === 0) {
    return (
      <>
        <div className="admin-metric-grid">
          <div className="admin-metric">
            <div className="label">Demandes</div>
            <div className="value">0</div>
          </div>
        </div>
        <div className="admin-empty">
          Aucune demande enregistrée pour le moment. Les demandes soumises depuis le Cockpit Builder client
          apparaîtront ici.
        </div>
        <QuickLinks />
      </>
    );
  }

  return (
    <>
      <div className="admin-metric-grid">
        <div className="admin-metric">
          <div className="label">Demandes</div>
          <div className="value">{total}</div>
        </div>
        <div className="admin-metric">
          <div className="label">À traiter</div>
          <div className="value">{aTraiter}</div>
        </div>
        <div className="admin-metric">
          <div className="label">Acceptées</div>
          <div className="value">{acceptees}</div>
        </div>
        <div className="admin-metric">
          <div className="label">Valeur commerciale cumulée</div>
          <div className="value">{Math.round(valeurCommerciale).toLocaleString("fr-FR")} €</div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Répartition par statut</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Statut</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {byStatus.map((s) => (
              <tr key={s.status}>
                <td>
                  <span className={`admin-badge ${s.status}`}>{s.status}</span>
                </td>
                <td>{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h2>Tendance</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Graphique d&apos;évolution — NON IMPLÉMENTÉ (aucune série temporelle agrégée disponible pour l&apos;instant).
        </p>
      </div>

      <QuickLinks />
    </>
  );
}

function QuickLinks() {
  return (
    <div className="admin-card">
      <h2>Accès rapide</h2>
      <div style={{ display: "flex", gap: 12 }}>
        <Link className="admin-btn secondary" href="/admin/demandes">
          Demandes
        </Link>
        <Link className="admin-btn secondary" href="/admin/catalogue">
          Catalogue
        </Link>
        <Link className="admin-btn secondary" href="/admin/parametres">
          Paramètres
        </Link>
      </div>
    </div>
  );
}
