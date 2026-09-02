import { PACKS } from "@/lib/data";
import { getCatalog } from "@/lib/server/catalog";
import CatalogueEditor from "./catalogue-editor";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const catalog = await getCatalog();

  return (
    <>
      <div className="admin-card">
        <h2>Packs</h2>
        <p style={{ margin: "4px 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
          Socles de pack et règles moteur (delivery, forcing, ROI) — non modifiables depuis le backoffice.
        </p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pack</th>
              <th>Prix de base</th>
              <th>Maintenance</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(PACKS) as (keyof typeof PACKS)[]).map((key) => (
              <tr key={key}>
                <td>{PACKS[key].label}</td>
                <td>{PACKS[key].base.toLocaleString("fr-FR")} €</td>
                <td>{PACKS[key].maint.toLocaleString("fr-FR")} €/mois</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CatalogueEditor initialDomains={catalog.domains} />
    </>
  );
}
