"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CatalogDomain, Pack, PackKey } from "@/lib/data";

type ModuleRow = { moduleId: string; name: string; build: number; maint: number; active: boolean };
type PackRow = { packKey: PackKey; label: string; base: number; maint: number };

function toModuleRows(domains: CatalogDomain[]): Map<string, ModuleRow> {
  const rows = new Map<string, ModuleRow>();
  for (const domain of domains) {
    for (const mod of domain.mods) {
      rows.set(mod.id, { moduleId: mod.id, name: mod.name, build: mod.build, maint: mod.maint, active: mod.active });
    }
  }
  return rows;
}

function toPackRows(packs: Record<PackKey, Pack>): Map<PackKey, PackRow> {
  const rows = new Map<PackKey, PackRow>();
  (Object.keys(packs) as PackKey[]).forEach((key) => {
    rows.set(key, { packKey: key, label: packs[key].label, base: packs[key].base, maint: packs[key].maint });
  });
  return rows;
}

export default function CatalogueEditor({
  initialDomains,
  initialPacks,
}: {
  initialDomains: CatalogDomain[];
  initialPacks: Record<PackKey, Pack>;
}) {
  const router = useRouter();
  const t = useTranslations("AdminCatalogue");
  const [domains, setDomains] = useState(initialDomains);
  const [moduleRows, setModuleRows] = useState<Map<string, ModuleRow>>(() => toModuleRows(initialDomains));
  const [packs, setPacks] = useState(initialPacks);
  const [packRows, setPackRows] = useState<Map<PackKey, PackRow>>(() => toPackRows(initialPacks));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initialModuleRows = useMemo(() => toModuleRows(initialDomains), [initialDomains]);
  const initialPackRows = useMemo(() => toPackRows(initialPacks), [initialPacks]);

  const dirtyModuleIds = useMemo(() => {
    const ids = new Set<string>();
    Array.from(moduleRows.entries()).forEach(([id, row]) => {
      const initial = initialModuleRows.get(id);
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
  }, [moduleRows, initialModuleRows]);

  const dirtyPackKeys = useMemo(() => {
    const keys = new Set<PackKey>();
    Array.from(packRows.entries()).forEach(([key, row]) => {
      const initial = initialPackRows.get(key);
      if (!initial) return;
      if (row.base !== initial.base || row.maint !== initial.maint) keys.add(key);
    });
    return keys;
  }, [packRows, initialPackRows]);

  const dirtyCount = dirtyModuleIds.size + dirtyPackKeys.size;

  function updateModuleRow<K extends keyof ModuleRow>(moduleId: string, key: K, value: ModuleRow[K]) {
    setModuleRows((prev) => {
      const next = new Map(prev);
      const current = next.get(moduleId);
      if (!current) return prev;
      next.set(moduleId, { ...current, [key]: value });
      return next;
    });
  }

  function updatePackRow<K extends "base" | "maint">(packKey: PackKey, key: K, value: number) {
    setPackRows((prev) => {
      const next = new Map(prev);
      const current = next.get(packKey);
      if (!current) return prev;
      next.set(packKey, { ...current, [key]: value });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modules: Array.from(moduleRows.values()),
        packs: Array.from(packRows.values()).map((p) => ({ packKey: p.packKey, base: p.base, maint: p.maint })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const updated: { domains: CatalogDomain[]; packs: Record<PackKey, Pack> } = await res.json();
      setDomains(updated.domains);
      setModuleRows(toModuleRows(updated.domains));
      setPacks(updated.packs);
      setPackRows(toPackRows(updated.packs));
      setMessage(t("saveSuccess"));
      router.refresh();
    } else {
      setMessage(t("saveError"));
    }
  }

  return (
    <div>
      <div className="admin-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{t("title")}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{t("intro")}</p>
        </div>
        <button className="admin-btn" onClick={handleSave} disabled={saving || dirtyCount === 0}>
          {saving ? t("saving") : dirtyCount > 0 ? t("saveWithCount", { count: dirtyCount }) : t("save")}
        </button>
      </div>
      {message && <p style={{ fontSize: 13, margin: "0 0 16px", color: "var(--text-secondary)" }}>{message}</p>}

      <div className="admin-card">
        <h2>{t("packsTitle")}</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("colPack")}</th>
              <th>{t("colPrixBase")}</th>
              <th>{t("colMaintenance")}</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(packs) as PackKey[]).map((key) => {
              const row = packRows.get(key);
              if (!row) return null;
              const dirty = dirtyPackKeys.has(key);
              return (
                <tr key={key} style={dirty ? { background: "rgba(208, 138, 71, 0.08)" } : undefined}>
                  <td>{row.label}</td>
                  <td>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      style={{ width: 110 }}
                      value={row.base}
                      onChange={(e) => updatePackRow(key, "base", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      style={{ width: 110 }}
                      value={row.maint}
                      onChange={(e) => updatePackRow(key, "maint", Number(e.target.value))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {domains.map((domain) => (
        <div className="admin-card" key={domain.key}>
          <h2>
            {domain.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {domain.type}</span>
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("colId")}</th>
                <th>{t("colLibelle")}</th>
                <th>{t("colBuild")}</th>
                <th>{t("colMaintenance")}</th>
                <th>{t("colActif")}</th>
              </tr>
            </thead>
            <tbody>
              {domain.mods.map((mod) => {
                const row = moduleRows.get(mod.id);
                if (!row) return null;
                const dirty = dirtyModuleIds.has(mod.id);
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
                        onChange={(e) => updateModuleRow(mod.id, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        type="number"
                        min={0}
                        style={{ width: 110 }}
                        value={row.build}
                        onChange={(e) => updateModuleRow(mod.id, "build", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        type="number"
                        min={0}
                        style={{ width: 110 }}
                        value={row.maint}
                        onChange={(e) => updateModuleRow(mod.id, "maint", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) => updateModuleRow(mod.id, "active", e.target.checked)}
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
