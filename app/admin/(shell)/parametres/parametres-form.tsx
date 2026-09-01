"use client";

import { useState } from "react";

type RoiSettings = {
  resourcePool: number;
  structureCost: number;
  directionCost: number;
  externalCosts: number;
  licenseCosts: number;
  otherCosts: number;
  minMarkup: number;
  allocationMode: "daily" | "monthly";
  productiveDays: number;
};

const FIELDS: { key: keyof RoiSettings; label: string }[] = [
  { key: "resourcePool", label: "Pool de ressources (€/mois)" },
  { key: "structureCost", label: "Coût de structure (€/mois)" },
  { key: "directionCost", label: "Coût direction (€/mois)" },
  { key: "externalCosts", label: "Coûts externes (€)" },
  { key: "licenseCosts", label: "Coûts de licences (€)" },
  { key: "otherCosts", label: "Autres coûts (€)" },
  { key: "productiveDays", label: "Jours productifs / mois" },
];

export default function ParametresForm({ initial }: { initial: RoiSettings }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof RoiSettings>(key: K, value: RoiSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/roi-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setMessage(res.ok ? "Paramètres enregistrés." : "Erreur lors de l'enregistrement.");
  }

  return (
    <div className="admin-card" style={{ maxWidth: 480 }}>
      <span className="admin-confidential">Confidentiel · Interne ADAI</span>
      <h2>Paramètres ROI ADAI</h2>

      {FIELDS.map((f) => (
        <div key={f.key} style={{ marginBottom: 14 }}>
          <label htmlFor={f.key} style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            {f.label}
          </label>
          <input
            id={f.key}
            type="number"
            className="admin-input"
            value={values[f.key] as number}
            onChange={(e) => update(f.key, Number(e.target.value) as never)}
          />
        </div>
      ))}

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="minMarkup" style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Markup minimum ({Math.round(values.minMarkup * 100)} %)
        </label>
        <input
          id="minMarkup"
          type="number"
          step={0.1}
          className="admin-input"
          value={values.minMarkup}
          onChange={(e) => update("minMarkup", Number(e.target.value))}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="allocationMode" style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Mode d&apos;allocation
        </label>
        <select
          id="allocationMode"
          className="admin-select"
          value={values.allocationMode}
          onChange={(e) => update("allocationMode", e.target.value as "daily" | "monthly")}
        >
          <option value="daily">Journalier</option>
          <option value="monthly">Mensuel</option>
        </select>
      </div>

      <button className="admin-btn" onClick={handleSave} disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && <p style={{ fontSize: 13, marginTop: 10, color: "var(--text-secondary)" }}>{message}</p>}
    </div>
  );
}
