import { PACKS, DOMAINS } from "@/lib/data";

export default function CataloguePage() {
  return (
    <>
      <div className="admin-card">
        <h2>Packs</h2>
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

      {DOMAINS.map((domain) => (
        <div className="admin-card" key={domain.key}>
          <h2>
            {domain.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {domain.type}</span>
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Module</th>
                <th>Build</th>
                <th>Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {domain.mods.map((mod) => (
                <tr key={mod.id}>
                  <td>
                    <code style={{ fontSize: 12, color: "var(--text-muted)" }}>{mod.id}</code>
                  </td>
                  <td>{mod.name}</td>
                  <td>{mod.build.toLocaleString("fr-FR")} €</td>
                  <td>{mod.maint.toLocaleString("fr-FR")} €/mois</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
