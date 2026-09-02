"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, type PackKey } from "@/lib/data";
import { calculate } from "@/lib/engine";
import type { BuilderState } from "@/lib/types";

const PACK_ORDER: PackKey[] = ["start", "grow", "scale"];

type Props = {
  demandeId: string;
  initialPack: PackKey;
  initialModules: string[];
  initialDiscountRate: number;
  initialRoiValidated: boolean;
  gate: boolean;
  status: string;
  publicUrl: string | null;
};

const BASE_STATE_SKELETON: Omit<BuilderState, "currentPack" | "selectedModules" | "pricing" | "roiClient"> = {
  client: {
    companyName: "",
    projectName: "",
    industry: "",
    subIndustry: "",
    revenue: "",
    companySize: "",
    impactedPeople: "",
    solutionUsers: "",
    organization: "Mono-site / 1 entité",
    siteCount: 1,
    entityCount: 1,
    countries: "1 pays",
    digitalMaturity: "",
    itCapacity: "",
    priority: "",
    timeline: "",
    budget: "",
    currentTools: "",
    painPoints: "",
  },
  need: {
    description: "",
    currentProcess: "",
    migration: "Aucune / légère",
    customization: "Standard",
    sensitive: "Non",
    roles: "",
    deliveryMode: "SCRATCH",
    integrationCount: 0,
    volume: "Faible",
  },
  roiAdai: {
    resourcePool: 0,
    structureCost: 0,
    directionCost: 0,
    externalCosts: 0,
    licenseCosts: 0,
    otherCosts: 0,
    minMarkup: 1,
    allocationMode: "daily",
  },
  openDomains: new Set<string>(),
};

export default function ReadjustPanel({
  demandeId,
  initialPack,
  initialModules,
  initialDiscountRate,
  initialRoiValidated,
  gate,
  status,
  publicUrl,
}: Props) {
  const router = useRouter();
  const [pack, setPack] = useState<PackKey>(initialPack);
  const [modules, setModules] = useState<Set<string>>(new Set(initialModules));
  const [discountRate, setDiscountRate] = useState(initialDiscountRate);
  const [roiValidated, setRoiValidated] = useState(initialRoiValidated);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewState: BuilderState = useMemo(
    () => ({
      ...BASE_STATE_SKELETON,
      currentPack: pack,
      selectedModules: modules,
      pricing: { discountRate, productiveDays: 20, deliveryConfidence: "Moyenne" },
      roiClient: {
        roiValidated,
        weeklyHours: 0,
        roiPeople: 1,
        hourlyCost: 0,
        automationRate: 0,
        realizationRate: 0,
        errorsAvoided: 0,
        errorCost: 0,
        toolSavings: 0,
        additionalRevenue: 0,
        contributionMargin: 0,
        fteHours: 1820,
        activeWeeks: 52,
      },
    }),
    [pack, modules, discountRate, roiValidated]
  );

  const preview = useMemo(() => calculate(previewState), [previewState]);

  // Admin pack consistency (BO-QA P1): never silently override the admin's pack choice —
  // surface the engine's required minimum and block publication until resolved instead.
  const isPackBelowMinimum = PACK_ORDER.indexOf(pack) < PACK_ORDER.indexOf(preview.forcedPack);
  const isDiscountAboveMax = discountRate * 100 > preview.maxDiscountRate;
  const publishBlockedByGuard = isPackBelowMinimum || isDiscountAboveMax;

  function toggleModule(id: string) {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/demandes/${demandeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPack: pack,
        selectedModules: Array.from(modules),
        pricing: { discountRate },
        roiClient: { roiValidated },
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Réajustement enregistré et recalculé par le moteur V6.");
      router.refresh();
    } else {
      setMessage("Erreur lors de l'enregistrement.");
    }
  }

  async function handlePublish(force = false) {
    setPublishing(true);
    setMessage(null);
    const res = await fetch(`/api/demandes/${demandeId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    setPublishing(false);
    if (res.status === 409) {
      const body = await res.json();
      setMessage(
        body.error === "GATE_FAILED" ? `${body.message} Publier quand même ?` : body.message
      );
      return;
    }
    if (res.ok) {
      setMessage("Offre publiée.");
      router.refresh();
    } else {
      setMessage("Erreur lors de la publication.");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Pack</span>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {(["start", "grow", "scale"] as PackKey[]).map((p) => (
            <button
              key={p}
              type="button"
              className="admin-btn secondary"
              aria-pressed={pack === p}
              onClick={() => setPack(p)}
              style={pack === p ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="admin-field-row"><span>Pack sélectionné</span><span>{pack.toUpperCase()}</span></div>
        <div className="admin-field-row"><span>Pack minimum requis</span><span>{preview.forcedPack.toUpperCase()}</span></div>
        {isPackBelowMinimum && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
            Cette configuration nécessite le pack {preview.forcedPack.toUpperCase()}.
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="discountRate" style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Remise
        </label>
        <input
          id="discountRate"
          type="range"
          min={0}
          max={preview.maxDiscountRate / 100}
          step={0.01}
          value={discountRate}
          onChange={(e) => setDiscountRate(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div className="admin-field-row"><span>Remise appliquée</span><span>{pct(discountRate * 100)}</span></div>
        <div className="admin-field-row"><span>Remise maximale autorisée</span><span>{pct(preview.maxDiscountRate)}</span></div>
        {isDiscountAboveMax && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
            Remise au-dessus du maximum autorisé par le moteur V6 ({pct(preview.maxDiscountRate)}).
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={roiValidated} onChange={(e) => setRoiValidated(e.target.checked)} />
          Hypothèses ROI client validées
        </label>
      </div>

      <details style={{ marginBottom: 16 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
          Modules ({modules.size} sélectionné{modules.size > 1 ? "s" : ""})
        </summary>
        <div style={{ maxHeight: 240, overflowY: "auto", marginTop: 10 }}>
          {DOMAINS.map((domain) => (
            <div key={domain.key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{domain.name}</div>
              {domain.mods.map((mod) => (
                <label key={mod.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "2px 0" }}>
                  <input type="checkbox" checked={modules.has(mod.id)} onChange={() => toggleModule(mod.id)} />
                  {mod.name}
                </label>
              ))}
            </div>
          ))}
        </div>
      </details>

      <div className="admin-card" style={{ padding: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 12 }}>Impact (aperçu, moteur V6)</h2>
        <div className="admin-field-row"><span>Catalogue</span><span>{euro(preview.catalogValue)}</span></div>
        <div className="admin-field-row"><span>Commercial</span><span>{euro(preview.commercialPrice)}</span></div>
        <div className="admin-field-row"><span>Maintenance an 1</span><span>{euro(preview.maintenanceYear1Monthly)}/mois</span></div>
        <div className="admin-field-row"><span>Délai</span><span>{preview.estimatedDays} j</span></div>
        <div className="admin-field-row"><span>Gate</span><span>{preview.gate ? "GO" : "NO-GO"}</span></div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="admin-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement..." : "Recalculer & enregistrer"}
        </button>
        <button
          className="admin-btn secondary"
          onClick={() => handlePublish(message?.includes("quand même") ?? false)}
          disabled={publishing || status === "accepted" || publishBlockedByGuard}
          title={publishBlockedByGuard ? "Configuration incohérente : corrigez le pack ou la remise avant de publier." : undefined}
        >
          {status === "accepted" ? "Déjà publiée" : publishing ? "Publication..." : "Publier l'offre"}
        </button>
      </div>

      {publishBlockedByGuard && (
        <p style={{ color: "#f87171", fontSize: 12, marginTop: 10 }}>
          Publication bloquée : la configuration doit être cohérente (pack et remise) avant publication.
        </p>
      )}
      {!gate && <p style={{ color: "#f87171", fontSize: 12, marginTop: 10 }}>Gate ROI ADAI actuellement NO-GO.</p>}
      {message && <p style={{ fontSize: 13, marginTop: 10, color: "var(--text-secondary)" }}>{message}</p>}
      {publicUrl && (
        <p style={{ fontSize: 13, marginTop: 10 }}>
          Offre publique : <code>{publicUrl}</code>
        </p>
      )}
    </div>
  );
}

function euro(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function pct(n: number): string {
  return `${(Math.round(n * 10) / 10).toLocaleString("fr-FR")} %`;
}
