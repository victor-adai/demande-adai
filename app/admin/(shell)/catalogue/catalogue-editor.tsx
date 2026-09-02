"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogDomain } from "@/lib/data";

type Row = { moduleId: string; name: string; build: number; maint: number; active: boolean };

function toRows(domains: CatalogDomain[]): Map<string, Row> {
  const rows = new Map<string, Row>();
  for (const domain of domains) {
    for (const mod of domain.mods) {
      rows.set(mod.id, { moduleId: mod.id, name: mod.name, build: mod.build, maint: mod.maint, active: mod.active });
    }
  }
  return rows;
}

export default function CatalogueEditor({ initialDomains }: { initialDomains: CatalogDomain[] }) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [rows, setRows] = useState<Map<string, Row>>(() => toRows(initialDomains));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initialRows = useMemo(() => toRows(initialDomains), [initialDomains]);
  const dirtyIds = useMemo(() => {
    const ids = new Set<string>();
    Array.from(rows.entries()).forEach(([id, row]) => {
      const initial = initialRows.get(id);
      if (!initial) return;
      if (
        row.name !== initial.name ||
        row.build !== initial.build ||
        row.maint !== initial.maint ||
        row.active !== initial.active
      ) {
        ids.add(id);
      }
    });
    return ids;
  }, [rows, initialRows]);

  function updateRow<K extends keyof Row>(moduleId: string, key: K, value: Row[K]) {
    setRows((prev) => {
      const next = new Map(prev);
      const current = next.get(moduleId);
      if (!current) return prev;
      next.set(moduleId, { ...current, [key]: value });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: Array.from(rows.values()) }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setDomains(updated.domains);
      setRows(toRows(updated.domains));
      setMessage("Catalogue enregistré et pris en compte immédiatement par le moteur V6.");
      router.refresh();
    } else {
      setMessage("Erreur lors de l'enregistrement du catalogue.");
    }
  }

  return (
    <div>
      <div className="admin-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Catalogue des modules</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Libellé, prix BUILD et maintenance modifiables. Les identifiants techniques sont immuables ; désactivez un
            module au lieu de le supprimer (l&apos;historique des demandes existantes reste inchangé).
          </p>
        </div>
        <button className="admin-btn" onClick={handleSave} disabled={saving || dirtyIds.size === 0}>
          {saving ? "Enregistrement..." : dirtyIds.size > 0 ? `Enregistrer (${dirtyIds.size})` : "Enregistrer"}
        </button>
      </div>
      {message && (
        <p style={{ fontSize: 13, margin: "0 0 16px", color: "var(--text-secondary)" }}>{message}</p>
      )}

      {domains.map((domain) => (
        <div className="admin-card" key={domain.key}>
          <h2>
            {domain.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {domain.type}</span>
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Libellé</th>
                <th>Build (€)</th>
                <th>Maintenance (€/mois)</th>
                <th>Actif</th>
              </tr>
            </thead>
            <tbody>
              {domain.mods.map((mod) => {
                const row = rows.get(mod.id);
                if (!row) return null;
                const dirty = dirtyIds.has(mod.id);
                return (
                  <tr key={mod.id} style={dirty ? { background: "rgba(208, 138, 71, 0.08)" } : undefined}>
                    <td>
                      <code style={{ fontSize: 12, color: "var(--text-muted)" }}>{mod.id}</code>
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        style={{ minWidth: 220 }}
                        value={row.name}
                        onChange={(e) => updateRow(mod.id, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        type="number"
                        min={0}
                        style={{ width: 110 }}
                        value={row.build}
                        onChange={(e) => updateRow(mod.id, "build", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        type="number"
                        min={0}
                        style={{ width: 110 }}
                        value={row.maint}
                        onChange={(e) => updateRow(mod.id, "maint", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) => updateRow(mod.id, "active", e.target.checked)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
