"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PACKS, defaultCatalogDomains, type CatalogDomain, type Pack, type PackKey } from "@/lib/data";
import { calculate } from "@/lib/engine";
import type { BuilderState, ClientProfile, NeedProfile, PricingParams, RoiAdaiParams, RoiClientParams } from "@/lib/types";

const PACK_ORDER: PackKey[] = ["start", "grow", "scale"];

type Props = {
  demandeId: string;
  // Real persisted state of the demande (CURRENT) — the preview below is built by
  // overlaying only the fields the admin is actively editing (pack/modules/discount/
  // roiValidated) onto this, so it never diverges from what readjustDemande() will
  // actually persist and what evaluatePublishGuard() will actually check server-side.
  client: ClientProfile;
  need: NeedProfile;
  roiAdai: RoiAdaiParams;
  pricing: PricingParams;
  roiClient: RoiClientParams;
  domains?: CatalogDomain[];
  packs?: Record<PackKey, Pack>;
  initialPack: PackKey;
  initialModules: string[];
  initialDiscountRate: number;
  initialRoiValidated: boolean;
  gate: boolean;
  status: string;
  publicUrl: string | null;
};

export default function ReadjustPanel({
  demandeId,
  client,
  need,
  roiAdai,
  pricing,
  roiClient,
  domains = defaultCatalogDomains(),
  packs = PACKS,
  initialPack,
  initialModules,
  initialDiscountRate,
  initialRoiValidated,
  gate,
  status,
  publicUrl,
}: Props) {
  const router = useRouter();
  const t = useTranslations("AdminReadjust");
  const [pack, setPack] = useState<PackKey>(initialPack);
  const [modules, setModules] = useState<Set<string>>(new Set(initialModules));
  const [discountRate, setDiscountRate] = useState(initialDiscountRate);
  const [roiValidated, setRoiValidated] = useState(initialRoiValidated);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [gateBlocked, setGateBlocked] = useState(false);

  // CURRENT vs PREVIEW fix (P1) : le preview reprend l'état RÉEL de la demande
  // (client/need/roiAdai/pricing/roiClient) et n'y superpose que les champs en
  // cours d'édition — même logique de fusion que readjustDemande() côté serveur.
  const previewState: BuilderState = useMemo(
    () => ({
      client,
      need,
      roiAdai,
      openDomains: new Set<string>(),
      currentPack: pack,
      selectedModules: modules,
      pricing: { ...pricing, discountRate },
      roiClient: { ...roiClient, roiValidated },
    }),
    [client, need, roiAdai, pricing, roiClient, pack, modules, discountRate, roiValidated]
  );

  const preview = useMemo(() => calculate(previewState, domains, packs), [previewState, domains, packs]);

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
      setMessage(t("saveSuccess"));
      router.refresh();
    } else {
      setMessage(t("saveError"));
    }
  }

  async function handlePublish(force = false) {
    setPublishing(true);
    setMessage(null);
    setGateBlocked(false);
    const res = await fetch(`/api/demandes/${demandeId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    setPublishing(false);
    if (res.status === 409) {
      const body = await res.json();
      if (body.error === "GATE_FAILED") {
        setGateBlocked(true);
        setMessage(`${body.message} ${t("publishAnyway")}`);
      } else {
        setMessage(body.message);
      }
      return;
    }
    if (res.ok) {
      setMessage(t("publishSuccess"));
      router.refresh();
    } else {
      setMessage(t("publishError"));
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("pack")}</span>
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
        <div className="admin-field-row"><span>{t("packSelectionne")}</span><span>{pack.toUpperCase()}</span></div>
        <div className="admin-field-row"><span>{t("packMinimumRequis")}</span><span>{preview.forcedPack.toUpperCase()}</span></div>
        {isPackBelowMinimum && (
          <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
            {t("packWarning", { pack: preview.forcedPack.toUpperCase() })}
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="discountRate" style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          {t("remise")}
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
        <div className="admin-field-row"><span>{t("remiseAppliquee")}</span><span>{pct(discountRate * 100)}</span></div>
        <div className="admin-field-row"><span>{t("remiseMaximale")}</span><span>{pct(preview.maxDiscountRate)}</span></div>
        {isDiscountAboveMax && (
          <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
            {t("remiseWarning", { max: pct(preview.maxDiscountRate) })}
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={roiValidated} onChange={(e) => setRoiValidated(e.target.checked)} />
          {t("hypothesesValidees")}
        </label>
      </div>

      <details style={{ marginBottom: 16 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
          {t("modulesCount", { count: modules.size, plural: modules.size > 1 ? "s" : "" })}
        </summary>
        <div style={{ maxHeight: 240, overflowY: "auto", marginTop: 10 }}>
          {domains.map((domain) => (
            <div key={domain.key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{domain.name}</div>
              {domain.mods.map((mod) => {
                const checked = modules.has(mod.id);
                return (
                  <label
                    key={mod.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      padding: "2px 0",
                      opacity: !mod.active ? 0.55 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!mod.active && !checked}
                      onChange={() => toggleModule(mod.id)}
                    />
                    {mod.name}
                    {!mod.active && <span style={{ fontStyle: "italic", color: "var(--accent)" }}> · indisponible</span>}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </details>

      <div className="admin-card" style={{ padding: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 12 }}>{t("impactTitle")}</h2>
        <div className="admin-field-row"><span>{t("catalogue")}</span><span>{euro(preview.catalogValue)}</span></div>
        <div className="admin-field-row"><span>{t("commercial")}</span><span>{euro(preview.commercialPrice)}</span></div>
        <div className="admin-field-row"><span>{t("maintenanceAn1")}</span><span>{euro(preview.maintenanceYear1Monthly)}/mois</span></div>
        <div className="admin-field-row"><span>{t("delai")}</span><span>{preview.estimatedDays} j</span></div>
        <div className="admin-field-row"><span>{t("gate")}</span><span>{preview.gate ? "GO" : "NO-GO"}</span></div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="admin-btn" onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("save")}
        </button>
        <button
          className="admin-btn secondary"
          onClick={() => handlePublish(gateBlocked)}
          disabled={publishing || status === "accepted" || publishBlockedByGuard}
          title={publishBlockedByGuard ? t("publishBlockedTitle") : undefined}
        >
          {status === "accepted" ? t("alreadyPublished") : publishing ? t("publishing") : t("publish")}
        </button>
      </div>

      {publishBlockedByGuard && (
        <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>
          {t("publishBlocked")}
        </p>
      )}
      {!gate && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{t("gateNoGo")}</p>}
      {message && <p style={{ fontSize: 13, marginTop: 10, color: "var(--text-secondary)" }}>{message}</p>}
      {publicUrl && (
        <p style={{ fontSize: 13, marginTop: 10 }}>
          {t("publicOffer")} <code>{publicUrl}</code>
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
