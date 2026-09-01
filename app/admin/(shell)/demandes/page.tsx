import Link from "next/link";
import { listDemandes, type DemandeStatus } from "@/lib/server/demandes";

export const dynamic = "force-dynamic";

const STATUSES: DemandeStatus[] = ["submitted", "adjusted", "accepted", "rejected"];

export default async function DemandesListPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string };
}) {
  const status = searchParams.status && STATUSES.includes(searchParams.status as DemandeStatus)
    ? (searchParams.status as DemandeStatus)
    : undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const { items, total, pageSize } = await listDemandes({
    search: searchParams.search,
    status,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="admin-card">
      <form method="get" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          className="admin-input"
          type="search"
          name="search"
          placeholder="Rechercher une entreprise ou un projet..."
          defaultValue={searchParams.search ?? ""}
          style={{ maxWidth: 320 }}
          suppressHydrationWarning
        />
        <select className="admin-select" name="status" defaultValue={searchParams.status ?? ""} style={{ maxWidth: 200 }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="admin-btn">
          Filtrer
        </button>
      </form>

      {items.length === 0 ? (
        <div className="admin-empty">Aucune demande ne correspond à ces critères.</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Projet</th>
                <th>Pack</th>
                <th>Prix commercial</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.companyName}</td>
                  <td>{d.projectName}</td>
                  <td>{d.pack.toUpperCase()}</td>
                  <td>{Math.round(d.commercialPrice).toLocaleString("fr-FR")} €</td>
                  <td>
                    <span className={`admin-badge ${d.status}`}>{d.status}</span>
                  </td>
                  <td>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <Link className="admin-btn secondary" href={`/admin/demandes/${d.id}`}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <nav aria-label="Pagination" style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams();
                if (searchParams.search) params.set("search", searchParams.search);
                if (searchParams.status) params.set("status", searchParams.status);
                params.set("page", String(p));
                return (
                  <Link
                    key={p}
                    href={`/admin/demandes?${params.toString()}`}
                    className="admin-btn secondary"
                    aria-current={p === page ? "page" : undefined}
                    style={p === page ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
