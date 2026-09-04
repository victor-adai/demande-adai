"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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

const FIELD_KEYS: { key: keyof RoiSettings; labelKey: string }[] = [
  { key: "resourcePool", labelKey: "resourcePool" },
  { key: "structureCost", labelKey: "structureCost" },
  { key: "directionCost", labelKey: "directionCost" },
  { key: "externalCosts", labelKey: "externalCosts" },
  { key: "licenseCosts", labelKey: "licenseCosts" },
  { key: "otherCosts", labelKey: "otherCosts" },
  { key: "productiveDays", labelKey: "productiveDays" },
];

export default function ParametresForm({ initial }: { initial: RoiSettings }) {
  const t = useTranslations("AdminParametres");
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
    setMessage(res.ok ? t("saveSuccess") : t("saveError"));
  }

  return (
    <div className="admin-card" style={{ maxWidth: 480 }}>
      <span className="admin-confidential">{t("confidentiel")}</span>
      <h2>{t("title")}</h2>

      {FIELD_KEYS.map((f) => (
        <div key={f.key} style={{ marginBottom: 14 }}>
          <label htmlFor={f.key} style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            {t(f.labelKey)}
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
          {t("minMarkup", { pct: Math.round(values.minMarkup * 100) })}
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
          {t("allocationMode")}
        </label>
        <select
          id="allocationMode"
          className="admin-select"
          value={values.allocationMode}
          onChange={(e) => update("allocationMode", e.target.value as "daily" | "monthly")}
        >
          <option value="daily">{t("daily")}</option>
          <option value="monthly">{t("monthly")}</option>
        </select>
      </div>

      <button className="admin-btn" onClick={handleSave} disabled={saving}>
        {saving ? t("saving") : t("save")}
      </button>
      {message && <p style={{ fontSize: 13, marginTop: 10, color: "var(--text-secondary)" }}>{message}</p>}
    </div>
  );
}
