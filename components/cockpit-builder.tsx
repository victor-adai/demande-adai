"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PACKS, defaultCatalogDomains, type CatalogDomain, type Pack, type PackKey } from "@/lib/data";
import {
  calculate,
  applyPreset,
  euro,
  pct,
  buildPayload,
} from "@/lib/engine";
import type { BuilderState, CalculationResult } from "@/lib/types";
import LanguageSwitcher from "@/components/language-switcher";

const initialState: BuilderState = {
  client: {
    companyName: "",
    projectName: "",
    industry: "",
    subIndustry: "",
    revenue: "< 100 k€",
    companySize: "1–10",
    impactedPeople: "1–3",
    solutionUsers: "1–10",
    organization: "Mono-site / 1 entité",
    siteCount: 1,
    entityCount: 1,
    countries: "1 pays",
    digitalMaturity: "Faible",
    itCapacity: "Aucune",
    priority: "Faible",
    timeline: "< 1 mois",
    budget: "Non communiqué",
    currentTools: "",
    painPoints: "",
  },
  need: {
    description: "",
    currentProcess: "Majoritairement manuel",
    migration: "Aucune / légère",
    customization: "Standard",
    sensitive: "Non",
    roles: "1 rôle",
    deliveryMode: "SCRATCH",
    integrationCount: 0,
    volume: "Faible",
  },
  pricing: {
    discountRate: 0,
    productiveDays: 20,
    deliveryConfidence: "Moyenne",
  },
  roiAdai: {
    resourcePool: 1500,
    structureCost: 1500,
    directionCost: 1000,
    externalCosts: 0,
    licenseCosts: 0,
    otherCosts: 0,
    minMarkup: 1,
    allocationMode: "daily",
  },
  roiClient: {
    roiValidated: false,
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
  selectedModules: new Set<string>(),
  openDomains: new Set<string>(),
  currentPack: "start",
};

function updateClient<K extends keyof BuilderState["client"]>(
  state: BuilderState,
  key: K,
  value: BuilderState["client"][K]
): BuilderState {
  return { ...state, client: { ...state.client, [key]: value } };
}

function updateNeed<K extends keyof BuilderState["need"]>(
  state: BuilderState,
  key: K,
  value: BuilderState["need"][K]
): BuilderState {
  return { ...state, need: { ...state.need, [key]: value } };
}

function updatePricing<K extends keyof BuilderState["pricing"]>(
  state: BuilderState,
  key: K,
  value: BuilderState["pricing"][K]
): BuilderState {
  return { ...state, pricing: { ...state.pricing, [key]: value } };
}

function updateRoiAdai<K extends keyof BuilderState["roiAdai"]>(
  state: BuilderState,
  key: K,
  value: BuilderState["roiAdai"][K]
): BuilderState {
  return { ...state, roiAdai: { ...state.roiAdai, [key]: value } };
}

function updateRoiClient<K extends keyof BuilderState["roiClient"]>(
  state: BuilderState,
  key: K,
  value: BuilderState["roiClient"][K]
): BuilderState {
  return { ...state, roiClient: { ...state.roiClient, [key]: value } };
}

function toggleModule(state: BuilderState, modId: string): BuilderState {
  const next = new Set(state.selectedModules);
  if (next.has(modId)) next.delete(modId);
  else next.add(modId);
  return { ...state, selectedModules: next };
}

function toggleDomainModules(
  state: BuilderState,
  domainKey: string,
  checked: boolean,
  domains: CatalogDomain[]
): BuilderState {
  const selected = new Set(state.selectedModules);
  const domain = domains.find((d) => d.key === domainKey);
  if (!domain) return state;
  for (const mod of domain.mods) {
    // Never let "select all in domain" newly select an inactive module; unchecking still
    // removes it if it was already selected (e.g. from before it was deactivated).
    if (checked) {
      if (mod.active) selected.add(mod.id);
    } else {
      selected.delete(mod.id);
    }
  }
  return { ...state, selectedModules: selected };
}

function setPack(state: BuilderState, pack: PackKey): BuilderState {
  return {
    ...state,
    currentPack: pack,
  };
}

function applyPresetToState(state: BuilderState, pack: PackKey): BuilderState {
  const preset = applyPreset(pack);
  return {
    ...state,
    currentPack: pack,
    selectedModules: preset.selectedModules,
    openDomains: state.openDomains,
    pricing: { ...state.pricing, discountRate: preset.discountRate },
    need: { ...state.need, deliveryMode: preset.deliveryMode },
  };
}

export function resetBuilderState(): BuilderState {
  return {
    ...initialState,
    selectedModules: new Set<string>(),
    openDomains: new Set<string>(),
  };
}

export default function CockpitBuilder({
  domains = defaultCatalogDomains(),
  packs = PACKS,
}: { domains?: CatalogDomain[]; packs?: Record<PackKey, Pack> } = {}) {
  const t = useTranslations("Cockpit");
  const tOpt = useTranslations("CockpitOptions");
  const [state, setState] = useState<BuilderState>(() => ({
    ...initialState,
    selectedModules: new Set<string>(),
    openDomains: new Set<string>(),
  }));

  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const result = useMemo<CalculationResult>(() => calculate(state, domains, packs), [state, domains, packs]);

  // DISPLAY STATE ONLY — no engine change. Below a qualified scope, pricing/delivery/ROI
  // figures are not meaningful yet (they're 0 by construction), so we show placeholders
  // instead of misleading zeros. Internal engine values (`result`) are untouched.
  const hasQualifiedScope = state.selectedModules.size > 0 && result.catalogValue > 0;

  // Sync forced pack from calculation back into state only when it changes
  useEffect(() => {
    if (result.forcedPack !== state.currentPack) {
      setState((prev) => ({ ...prev, currentPack: result.forcedPack }));
    }
  }, [result.forcedPack, state.currentPack]);

  function renderSidebar() {
    return (
      <aside className="sidebar">
        <div className="brand">
          ΛDΛI<small>{t("sidebar.tagline")}</small>
        </div>
        <LanguageSwitcher variant="front" />
        <div className="sideTag">
          <b>{t("sidebar.badge")}</b>
          <span>{t("sidebar.badgeDesc")}</span>
        </div>
        <p className="navTitle">{t("sidebar.navTitle")}</p>
        <nav className="nav">
          <a href="#client"><span className="num">01</span>{t("sidebar.nav1")}</a>
          <a href="#packs"><span className="num">02</span>{t("sidebar.nav2")}</a>
          <a href="#domains"><span className="num">03</span>{t("sidebar.nav3")}</a>
          <a href="#need"><span className="num">04</span>{t("sidebar.nav4")}</a>
          <a href="#pricing"><span className="num">05</span>{t("sidebar.nav5")}</a>
          {/* Lien ROI ADAI masqué sur l'écran client — réactiver avec la section renderRoiAdaiSection() */}
          {/* <a href="#roi-adai"><span className="num">06</span>ROI ADAI</a> */}
          <a href="#roi-client"><span className="num">06</span>{t("sidebar.nav6")}</a>
          <a href="#cockpit"><span className="num">07</span>{t("sidebar.nav7")}</a>
        </nav>
        <div className="sideKpis">
          <div className="sideKpi"><span>{t("sidebar.kpiPack")}</span><b>{packs[result.forcedPack].label}</b></div>
          <div className="sideKpi"><span>{t("sidebar.kpiPrice")}</span><b>{euro(result.commercialPrice)}</b></div>
          <div className="sideKpi"><span>{t("sidebar.kpiDays")}</span><b>{result.estimatedDays} {t("units.day")}</b></div>
          <div className="sideKpi"><span>{t("sidebar.kpiMarkup")}</span><b>{pct(result.markupPercent)}</b></div>
        </div>
      </aside>
    );
  }

  function renderHero() {
    return (
      <section className="hero">
        <div className="card heroMain">
          <div className="kicker">{t("hero.kicker")}</div>
          <h1>
            {t("hero.titleLine1")} <span>{t("hero.titleLine2")}</span>
          </h1>
          <p className="lead">{t("hero.lead")}</p>
          <div className="chips">
            <span className="chip">{t("hero.chipStart")}</span>
            <span className="chip">{t("hero.chipGrow")}</span>
            <span className="chip">{t("hero.chipScale")}</span>
          </div>
        </div>
        <div className="card why">
          <h2>{t("hero.ruleTitle")}</h2>
          <p>{t("hero.ruleLead")}</p>
          <div className="reason">
            <div className="mark">01</div>
            <div><b>{t("hero.reason1Title")}</b><span>{t("hero.reason1Text")}</span></div>
          </div>
          <div className="reason">
            <div className="mark">02</div>
            <div><b>{t("hero.reason2Title")}</b><span>{t("hero.reason2Text")}</span></div>
          </div>
          <div className="reason">
            <div className="mark">03</div>
            <div><b>{t("hero.reason3Title")}</b><span>{t("hero.reason3Text")}</span></div>
          </div>
        </div>
      </section>
    );
  }

  function clientField<K extends keyof BuilderState["client"]>(
    label: string,
    key: K,
    type: "text" | "number" | "select",
    options?: string[],
    wide?: boolean,
    full?: boolean
  ) {
    const value = state.client[key];
    let input: React.ReactNode;
    if (type === "select" && options) {
      input = (
        <select
          value={value as string}
          onChange={(e) => setState((prev) => updateClient(prev, key, e.target.value as BuilderState["client"][K]))}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{tOpt(opt)}</option>
          ))}
        </select>
      );
    } else if (type === "number") {
      input = (
        <input
          type="number"
          min={1}
          value={value as number}
          onChange={(e) => setState((prev) => updateClient(prev, key, Number(e.target.value) as BuilderState["client"][K]))}
        />
      );
    } else {
      input = (
        <input
          type="text"
          value={value as string}
          onChange={(e) => setState((prev) => updateClient(prev, key, e.target.value as BuilderState["client"][K]))}
        />
      );
    }
    return (
      <div className={`field${wide ? " wide" : ""}${full ? " full" : ""}`} key={key}>
        <label htmlFor={key}>{label}</label>
        {React.cloneElement(input as React.ReactElement, { id: key })}
      </div>
    );
  }

  function renderClientSection() {
    return (
      <section id="client" className="section">
        <div className="sectionHeader">
          <div>
            <h2>{t("client.title")}</h2>
            <p>{t("client.desc")}</p>
          </div>
        </div>
        <div className="card formCard">
          <div className="formGrid">
            {clientField(t("client.companyName"), "companyName", "text")}
            {clientField(t("client.projectName"), "projectName", "text")}
            {clientField(t("client.industry"), "industry", "text")}
            {clientField(t("client.subIndustry"), "subIndustry", "text")}
            {clientField(
              t("client.revenue"),
              "revenue",
              "select",
              ["< 100 k€", "100–500 k€", "500 k€–2 M€", "2–10 M€", "10 M€+"]
            )}
            {clientField(
              t("client.companySize"),
              "companySize",
              "select",
              ["1–10", "11–25", "26–50", "51–100", "101–250", "250+"]
            )}
            {clientField(
              t("client.impactedPeople"),
              "impactedPeople",
              "select",
              ["1–3", "4–10", "11–25", "26–50", "51–100", "100+"]
            )}
            {clientField(
              t("client.solutionUsers"),
              "solutionUsers",
              "select",
              ["1–10", "11–25", "26–50", "51–100", "101–250", "250+"]
            )}
            {clientField(
              t("client.organization"),
              "organization",
              "select",
              ["Mono-site / 1 entité", "Multi-sites", "Multi-entités", "Groupe / réseau", "Multi-pays"]
            )}
            {clientField(t("client.siteCount"), "siteCount", "number")}
            {clientField(t("client.entityCount"), "entityCount", "number")}
            {clientField(t("client.countries"), "countries", "select", ["1 pays", "2–3 pays", "4+ pays"])}
            {clientField(t("client.digitalMaturity"), "digitalMaturity", "select", ["Faible", "Intermédiaire", "Avancée"])}
            {clientField(t("client.itCapacity"), "itCapacity", "select", ["Aucune", "Prestataire", "Interne", "Mixte"])}
            {clientField(t("client.priority"), "priority", "select", ["Faible", "Moyenne", "Forte", "Critique"])}
            {clientField(t("client.timeline"), "timeline", "select", ["< 1 mois", "1–3 mois", "3–6 mois", "6 mois+"])}
            {clientField(
              t("client.budget"),
              "budget",
              "select",
              ["Non communiqué", "< 3 500 €", "3 500–7 000 €", "7 000–15 000 €", "15 000 €+"]
            )}
            {clientField(t("client.currentTools"), "currentTools", "text", undefined, true)}
            {clientField(t("client.painPoints"), "painPoints", "text", undefined, false, true)}
          </div>
        </div>
      </section>
    );
  }

  function renderPackSection() {
    return (
      <section id="packs" className="section">
        <div className="sectionHeader">
          <div>
            <h2>{t("packs.title")}</h2>
            <p>{t("packs.desc")}</p>
          </div>
        </div>
        <div className="packGrid">
          {(Object.keys(packs) as PackKey[]).map((key) => {
            const pack = packs[key];
            const selected = state.currentPack === key;
            return (
              <button
                key={key}
                className={`pack ${selected ? "selected" : ""}`}
                onClick={() => setState((prev) => setPack(prev, key))}
                type="button"
                aria-pressed={selected}
              >
                <span className="label">{pack.label}</span>
                <h3>
                  {key === "start" && t("packs.startTitle")}
                  {key === "grow" && t("packs.growTitle")}
                  {key === "scale" && t("packs.scaleTitle")}
                </h3>
                <p>
                  {key === "start" && t("packs.startDesc")}
                  {key === "grow" && t("packs.growDesc")}
                  {key === "scale" && t("packs.scaleDesc")}
                </p>
                <div className="price">{pack.base.toLocaleString("fr-FR")} €</div>
                <div className="maint">
                  {key === "start" && t("packs.startMaint")}
                  {key === "grow" && t("packs.growMaint")}
                  {key === "scale" && t("packs.scaleMaint")}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  function renderDomainSection() {
    return (
      <section id="domains" className="section">
        <div className="sectionHeader">
          <div>
            <h2>{t("domains.title")}</h2>
            <p>{t("domains.desc")}</p>
          </div>
        </div>
        <div className="domainToolbar">
          <button className="miniBtn" onClick={() => setState((prev) => applyPresetToState(prev, result.forcedPack))}>
            {t("domains.reloadPreset")}
          </button>
          <button
            className="miniBtn"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                openDomains: new Set(domains.map((d) => d.key)),
              }))
            }
          >
            {t("domains.openAll")}
          </button>
          <button
            className="miniBtn"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                selectedModules: new Set<string>(),
                openDomains: new Set<string>(),
              }))
            }
          >
            {t("domains.resetModules")}
          </button>
        </div>
        <div className="domainGrid">
          {domains.map((domain) => {
            const hasSelectedModule = domain.mods.some((m) => state.selectedModules.has(m.id));
            const isOpen = hasSelectedModule || state.openDomains.has(domain.key);
            return (
              <div className={`domain ${isOpen ? "active" : ""}`} key={domain.key}>
                <label className="domainHead">
                  <input
                    type="checkbox"
                    className="domainCheck"
                    data-domain={domain.key}
                    checked={hasSelectedModule}
                    onChange={(e) => setState((prev) => toggleDomainModules(prev, domain.key, e.target.checked, domains))}
                  />
                  <div>
                    <b>{domain.name}</b>
                    <span>{domain.type} — {domain.desc}</span>
                  </div>
                </label>
                <div className="modules">
                  {domain.mods.map((mod) => {
                    const checked = state.selectedModules.has(mod.id);
                    return (
                      <label className={`moduleLine${!mod.active ? " inactive" : ""}`} key={mod.id}>
                        <input
                          type="checkbox"
                          className="moduleCheck"
                          data-id={mod.id}
                          checked={checked}
                          disabled={!mod.active && !checked}
                          onChange={() => setState((prev) => toggleModule(prev, mod.id))}
                        />
                        <div>
                          <b>{mod.name}</b>
                          <span>{mod.desc}</span>
                          {!mod.active && <span className="inactiveTag"> · {t("domains.inactiveTag")}</span>}
                        </div>
                        <div className="modulePrice">+{euro(mod.build)}</div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderNeedSection() {
    return (
      <section id="need" className="section">
        <div className="sectionHeader">
          <div>
            <h2>{t("need.title")}</h2>
            <p>{t("need.desc")}</p>
          </div>
        </div>
        <div className="card formCard">
          <div className="formGrid">
            <div className="field full">
              <label htmlFor="needDescription">{t("need.description")}</label>
              <textarea
                id="needDescription"
                value={state.need.description}
                onChange={(e) => setState((prev) => updateNeed(prev, "description", e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="currentProcess">{t("need.currentProcess")}</label>
              <select
                id="currentProcess"
                value={state.need.currentProcess}
                onChange={(e) => setState((prev) => updateNeed(prev, "currentProcess", e.target.value))}
              >
                <option value="Majoritairement manuel">{tOpt("Majoritairement manuel")}</option>
                <option value="Mixte manuel + outils">{tOpt("Mixte manuel + outils")}</option>
                <option value="Déjà digitalisé">{tOpt("Déjà digitalisé")}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="migration">{t("need.migration")}</label>
              <select
                id="migration"
                value={state.need.migration}
                onChange={(e) => setState((prev) => updateNeed(prev, "migration", e.target.value))}
              >
                <option value="Aucune / légère">{tOpt("Aucune / légère")}</option>
                <option value="Simple">{tOpt("Simple")}</option>
                <option value="Multi-sources">{tOpt("Multi-sources")}</option>
                <option value="Complexe">{tOpt("Complexe")}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="customization">{t("need.customization")}</label>
              <select
                id="customization"
                value={state.need.customization}
                onChange={(e) => setState((prev) => updateNeed(prev, "customization", e.target.value))}
              >
                <option value="Standard">{tOpt("Standard")}</option>
                <option value="Adaptation légère">{tOpt("Adaptation légère")}</option>
                <option value="Adaptation significative">{tOpt("Adaptation significative")}</option>
                <option value="Spécifique">{tOpt("Spécifique")}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="sensitive">{t("need.sensitive")}</label>
              <select
                id="sensitive"
                value={state.need.sensitive}
                onChange={(e) => setState((prev) => updateNeed(prev, "sensitive", e.target.value))}
              >
                <option value="Non">{tOpt("Non")}</option>
                <option value="Oui">{tOpt("Oui")}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="roles">{t("need.roles")}</label>
              <select
                id="roles"
                value={state.need.roles}
                onChange={(e) => setState((prev) => updateNeed(prev, "roles", e.target.value))}
              >
                <option value="1 rôle">{tOpt("1 rôle")}</option>
                <option value="2–3 rôles">{tOpt("2–3 rôles")}</option>
                <option value="4+ rôles">{tOpt("4+ rôles")}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="deliveryMode">{t("need.deliveryMode")}</label>
              <select
                id="deliveryMode"
                value={state.need.deliveryMode}
                onChange={(e) =>
                  setState((prev) =>
                    updateNeed(prev, "deliveryMode", e.target.value as BuilderState["need"]["deliveryMode"])
                  )
                }
              >
                <option>SCRATCH</option>
                <option>PARTIAL_REUSE</option>
                <option>CORE_REUSE</option>
                <option>SAAS_ADAPT</option>
                <option>STANDARD_DEPLOY</option>
              </select>
              <div className="hint">{t("need.deliveryModeHint")}</div>
            </div>
            <div className="field">
              <label htmlFor="integrationCount">{t("need.integrationCount")}</label>
              <input
                id="integrationCount"
                type="number"
                min={0}
                value={state.need.integrationCount}
                onChange={(e) => setState((prev) => updateNeed(prev, "integrationCount", Number(e.target.value)))}
              />
            </div>
            <div className="field">
              <label htmlFor="volume">{t("need.volume")}</label>
              <select
                id="volume"
                value={state.need.volume}
                onChange={(e) => setState((prev) => updateNeed(prev, "volume", e.target.value))}
              >
                <option value="Faible">{tOpt("Faible")}</option>
                <option value="Moyenne">{tOpt("Moyenne")}</option>
                <option value="Élevée">{tOpt("Élevée")}</option>
                <option value="Très élevée">{tOpt("Très élevée")}</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderPricingSection() {
    return (
      <section id="pricing" className="section twoCol">
        <div>
          <div className="sectionHeader">
            <div>
              <h2>{t("pricing.title")}</h2>
              <p>{t("pricing.desc")}</p>
            </div>
          </div>
          <div className="card formCard">
            <div className="formGrid">
              <div className="field">
                <label htmlFor="discountRate">{t("pricing.discountRate")}</label>
                <select
                  id="discountRate"
                  value={state.pricing.discountRate}
                  onChange={(e) => setState((prev) => updatePricing(prev, "discountRate", Number(e.target.value)))}
                >
                  <option value={0}>0 %</option>
                  <option value={0.1}>10 %</option>
                  <option value={0.15}>15 %</option>
                  <option value={0.2}>20 %</option>
                  <option value={0.25}>25 %</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="productiveDays">{t("pricing.productiveDays")}</label>
                <input
                  id="productiveDays"
                  type="number"
                  min={1}
                  value={state.pricing.productiveDays}
                  onChange={(e) => setState((prev) => updatePricing(prev, "productiveDays", Number(e.target.value)))}
                />
              </div>
              <div className="field">
                <label htmlFor="deliveryConfidence">{t("pricing.deliveryConfidence")}</label>
                <select
                  id="deliveryConfidence"
                  value={state.pricing.deliveryConfidence}
                  onChange={(e) => setState((prev) => updatePricing(prev, "deliveryConfidence", e.target.value))}
                >
                  <option value="Faible">{tOpt("Faible")}</option>
                  <option value="Moyenne">{tOpt("Moyenne")}</option>
                  <option value="Haute">{tOpt("Haute")}</option>
                </select>
              </div>
            </div>
            <div className="divider" />
            <div className="metricGrid">
              <div className="metric"><span>{t("pricing.metricModulesValue")}</span><b>{euro(result.functionalValue)}</b></div>
              <div className="metric"><span>{t("pricing.metricComplexity")}</span><b>{result.complexityAdjustment ? `+${euro(result.complexityAdjustment)}` : euro(0)}</b></div>
              <div className="metric"><span>{t("pricing.metricCatalogValue")}</span><b>{euro(result.catalogValue)}</b></div>
              <div className="metric"><span>{t("pricing.metricDelivery")}</span><b>{hasQualifiedScope ? `${result.estimatedDays} ${t("units.day")}` : t("pricing.toBeEstimated")}</b></div>
            </div>
            <div className="divider" />
            <div className="subtle">{t("pricing.note")}</div>
          </div>
        </div>

        <aside className="sticky">
          <div className="card summary">
            <div className="summaryTop">
              <small>{t("pricing.summaryActive")}</small>
              <h2 style={{ margin: "6px 0 0" }}>{packs[result.forcedPack].label}</h2>
              <div className="summaryPrice">{hasQualifiedScope ? euro(result.commercialPrice) : t("pricing.toBeCalculated")}</div>
              <small>{t("pricing.summaryHint")}</small>
            </div>
            <div className="row"><span>{t("pricing.rowPackBase")}</span><b>{euro(packs[result.forcedPack].base)}</b></div>
            <div className="row"><span>{t("pricing.rowCatalogValue")}</span><b>{euro(result.catalogValue)}</b></div>
            <div className="row"><span>{t("pricing.rowDiscount")}</span><b>{Math.round(state.pricing.discountRate * 100)} %</b></div>
            <div className="row"><span>{t("pricing.rowMaintenance")}</span><b>{euro(result.maintenanceYear1Monthly)}{t("units.perMonth")}</b></div>
            <div className="row"><span>{t("pricing.rowYear1")}</span><b>{euro(result.year1Revenue)}</b></div>
            <div className="row"><span>{t("pricing.rowMarginStatus")}</span><b>{!hasQualifiedScope ? <span className="badge amber">{t("pricing.badgePending")}</span> : result.gate ? <span className="badge green">{t("pricing.badgeValidated")}</span> : <span className="badge red">{t("pricing.badgeToReview")}</span>}</b></div>
          </div>
        </aside>
      </section>
    );
  }

  // Section masquée sur l'écran client (données internes ADAI). Conservée pour réactivation.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderRoiAdaiSection() {
    return (
      <section id="roi-adai" className="section">
        <div className="sectionHeader">
          <div>
            <h2>06 — Dalle ROI ADAI</h2>
            <p>Back-office uniquement : coût de revient, prix plancher, markup, marge et remise maximale autorisée.</p>
          </div>
          <span className="badge blue">INTERNE ADAI</span>
        </div>
        <div className="card formCard">
          <div className="formGrid">
            {[
              ["resourcePool", "Pull ressources / mois"],
              ["structureCost", "Frais de structure / mois"],
              ["directionCost", "Investissement / direction / mois"],
              ["externalCosts", "Prestataires directs dossier"],
              ["licenseCosts", "Licences / infrastructure dossier"],
              ["otherCosts", "Autres coûts directs"],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="number"
                  min={0}
                  value={state.roiAdai[key as keyof BuilderState["roiAdai"]] as number}
                  onChange={(e) =>
                    setState((prev) => updateRoiAdai(prev, key as keyof BuilderState["roiAdai"], Number(e.target.value)))
                  }
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="minMarkup">Markup minimum cible</label>
              <select
                id="minMarkup"
                value={state.roiAdai.minMarkup}
                onChange={(e) => setState((prev) => updateRoiAdai(prev, "minMarkup", Number(e.target.value)))}
              >
                <option value={0.75}>75 %</option>
                <option value={1}>100 %</option>
                <option value={1.25}>125 %</option>
                <option value={1.5}>150 %</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="allocationMode">Allocation des coûts fixes</label>
              <select
                id="allocationMode"
                value={state.roiAdai.allocationMode}
                onChange={(e) =>
                  setState((prev) =>
                    updateRoiAdai(prev, "allocationMode", e.target.value as "daily" | "monthly")
                  )
                }
              >
                <option value="daily">Au prorata des jours productifs</option>
                <option value="monthly">Mois complet</option>
              </select>
            </div>
          </div>
          <div className="metricGrid">
            <div className="metric"><span>Coût interne / jour</span><b>{euro(result.internalDailyCost)}/j</b></div>
            <div className="metric"><span>Coût ADAI projet</span><b>{euro(result.adaiCost)}</b></div>
            <div className="metric"><span>Prix plancher ADAI</span><b>{euro(result.floorPrice)}</b></div>
            <div className="metric"><span>Markup réel</span><b>{hasQualifiedScope ? pct(result.markupPercent) : "—"}</b></div>
          </div>
          <div className="metricGrid">
            <div className="metric"><span>Marge brute €</span><b>{euro(result.grossProfit)}</b></div>
            <div className="metric"><span>Marge / CA</span><b>{pct(result.grossMarginPercent)}</b></div>
            <div className="metric"><span>Remise maximale</span><b>{pct(result.maxDiscountRate)}</b></div>
            <div className="metric"><span>Gate ADAI</span><b>{!hasQualifiedScope ? <span className="badge amber">EN ATTENTE</span> : result.gate ? <span className="badge green">GO</span> : <span className="badge red">NO-GO / VALIDATION</span>}</b></div>
          </div>
        </div>
      </section>
    );
  }

  function renderRoiClientSection() {
    return (
      <section id="roi-client" className="section">
        <div className="sectionHeader">
          <div>
            <h2>{t("roiClient.title")}</h2>
            <p>{t("roiClient.desc")}</p>
          </div>
          <span className="badge amber">{t("roiClient.reviewBadge")}</span>
        </div>
        <div className="roiClient">
          <div className="toggleLine">
            <div>
              <label htmlFor="roiValidated"><b>{t("roiClient.validatedLabel")}</b></label>
              <div className="hint">{t("roiClient.validatedHint")}</div>
            </div>
            <input
              id="roiValidated"
              type="checkbox"
              checked={state.roiClient.roiValidated}
              onChange={(e) => setState((prev) => updateRoiClient(prev, "roiValidated", e.target.checked))}
            />
          </div>
          <div className="roiGrid">
            {(
              [
                ["weeklyHours", t("roiClient.weeklyHours"), 0, 0.5],
                ["roiPeople", t("roiClient.roiPeople"), 1, 1],
                ["hourlyCost", t("roiClient.hourlyCost"), 0, 1],
                ["automationRate", t("roiClient.automationRate"), 0, 1],
                ["realizationRate", t("roiClient.realizationRate"), 0, 1],
                ["errorsAvoided", t("roiClient.errorsAvoided"), 0, 1],
                ["errorCost", t("roiClient.errorCost"), 0, 1],
                ["toolSavings", t("roiClient.toolSavings"), 0, 1],
                ["additionalRevenue", t("roiClient.additionalRevenue"), 0, 1],
                ["contributionMargin", t("roiClient.contributionMargin"), 0, 1],
                ["fteHours", t("roiClient.fteHours"), 1, 1],
                ["activeWeeks", t("roiClient.activeWeeks"), 1, 1],
              ] as [keyof BuilderState["roiClient"], string, number, number][]
            ).map(([key, label, min, step]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="number"
                  min={min}
                  step={step}
                  value={state.roiClient[key as keyof BuilderState["roiClient"]] as number}
                  onChange={(e) =>
                    setState((prev) =>
                      updateRoiClient(prev, key as keyof BuilderState["roiClient"], Number(e.target.value))
                    )
                  }
                />
              </div>
            ))}
          </div>
          {state.roiClient.roiValidated ? (
            <div id="roiUnlocked">
              <div className="metricGrid">
                <div className="metric"><span>{t("roiClient.hoursSaved")}</span><b>{Math.round(result.hoursSaved).toLocaleString("fr-FR")} {t("units.hoursPerYear")}</b></div>
                <div className="metric"><span>{t("roiClient.grossTimeValue")}</span><b>{euro(result.grossTimeValue)}{t("units.perYear")}</b></div>
                <div className="metric"><span>{t("roiClient.realizedValue")}</span><b>{euro(result.realizedAnnualValue)}{t("units.perYear")}</b></div>
                <div className="metric"><span>{t("roiClient.fteEquivalent")}</span><b>{(Math.round(result.fteEquivalent * 10) / 10).toLocaleString("fr-FR")} {t("units.fte")}</b></div>
              </div>
              <div className="metricGrid">
                <div className="metric"><span>{t("roiClient.investment")}</span><b>{euro(result.clientInvestment)}</b></div>
                <div className="metric"><span>{t("roiClient.netGain")}</span><b>{euro(result.clientNetGain)}</b></div>
                <div className="metric"><span>{t("roiClient.roi")}</span><b>{pct(result.clientRoiPercent)}</b></div>
                <div className="metric"><span>{t("roiClient.payback")}</span><b>{(Math.round(result.paybackMonths * 10) / 10).toLocaleString("fr-FR")} {t("units.month")}</b></div>
              </div>
            </div>
          ) : (
            <div className="roiLocked">{t("roiClient.locked")}</div>
          )}
        </div>
      </section>
    );
  }

  function renderCockpitSection() {
    const payload = buildPayload(state, result, packs);
    const json = JSON.stringify(payload, null, 2);
    return (
      <section id="cockpit" className="section">
        <div className="sectionHeader">
          <div>
            <h2>{t("cockpit.title")}</h2>
            <p>{t("cockpit.desc")}</p>
          </div>
        </div>
        <div className="twoCol">
          <div className="card formCard">
            <h3 style={{ marginTop: 0 }}>{t("cockpit.readTitle")}</h3>
            <div className="row"><span>{t("cockpit.rowCompany")}</span><b>{state.client.companyName} — {state.client.industry}</b></div>
            <div className="row"><span>{t("cockpit.rowRecommendedPack")}</span><b>{packs[result.forcedPack].label}</b></div>
            <div className="row"><span>{t("cockpit.rowDomains")}</span><b>{result.activeDomainNames.length}</b></div>
            <div className="row"><span>{t("cockpit.rowModules")}</span><b>{result.selectedIds.length}</b></div>
            <div className="row"><span>{t("cockpit.rowCatalogPrice")}</span><b>{euro(result.catalogValue)}</b></div>
            <div className="row"><span>{t("cockpit.rowCommercialPrice")}</span><b>{hasQualifiedScope ? euro(result.commercialPrice) : t("pricing.toBeCalculated")}</b></div>
            <div className="row"><span>{t("cockpit.rowDelivery")}</span><b>{hasQualifiedScope ? `${result.estimatedDays} ${t("units.day")} — ${state.need.deliveryMode}` : t("pricing.toBeEstimated")}</b></div>
            <div className="row"><span>{t("cockpit.rowRoiAdai")}</span><b>{hasQualifiedScope ? `${result.gate ? "GO" : t("cockpit.toReview")} — markup ${pct(result.markupPercent)}` : t("cockpit.rowRoiAdaiPending")}</b></div>
            <div className="row"><span>{t("cockpit.rowRoiClient")}</span><b>{!hasQualifiedScope ? t("cockpit.rowRoiClientToValidate") : state.roiClient.roiValidated ? `${pct(result.clientRoiPercent)} — payback ${(Math.round(result.paybackMonths * 10) / 10)} ${t("units.month")}` : t("cockpit.rowRoiClientToValidateReview")}</b></div>
            <div className="divider" />
            <div className="pillList">
              {result.selectedIds.map((id) => {
                const mod = domains.flatMap((d) => d.mods).find((m) => m.id === id);
                return mod ? <span className="pill" key={id}>{mod.name}</span> : null;
              })}
            </div>
          </div>
          <div className="card formCard">
            <h3 style={{ marginTop: 0 }}>{t("cockpit.exportTitle")}</h3>
            <textarea className="jsonBox" readOnly value={json} />
            <div className="ctaRow" style={{ marginTop: 12 }}>
              <button
                className="cta primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(json);
                    alert(t("cockpit.copyDone"));
                  } catch {
                    // fallback not needed in modern browsers
                  }
                }}
              >
                {t("cockpit.copyJson")}
              </button>
              <button
                className="cta copper"
                onClick={() => {
                  const blob = new Blob([json], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `ADAI_V6_${state.client.projectName || "projet"}.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                {t("cockpit.downloadJson")}
              </button>
              <button
                className="cta secondary"
                onClick={() => {
                  try {
                    localStorage.setItem(`ADAI_V6_${state.client.projectName || "projet"}`, json);
                    alert(t("cockpit.saveDone"));
                  } catch {
                    alert(t("cockpit.saveError"));
                  }
                }}
              >
                {t("cockpit.saveLocal")}
              </button>
              <button
                className="cta primary"
                disabled={submitStatus === "sending"}
                onClick={async () => {
                  setSubmitStatus("sending");
                  try {
                    const res = await fetch("/api/demandes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        currentPack: state.currentPack,
                        selectedModules: Array.from(state.selectedModules),
                        client: state.client,
                        need: state.need,
                        pricing: state.pricing,
                        roiAdai: state.roiAdai,
                        roiClient: state.roiClient,
                      }),
                    });
                    if (!res.ok) throw new Error("submit failed");
                    setSubmitStatus("sent");
                  } catch {
                    setSubmitStatus("error");
                  }
                }}
              >
                {submitStatus === "sending"
                  ? t("cockpit.submitSending")
                  : submitStatus === "sent"
                    ? t("cockpit.submitSent")
                    : submitStatus === "error"
                      ? t("cockpit.submitError")
                      : t("cockpit.submitIdle")}
              </button>
              <button
                className="cta secondary"
                onClick={() => window.print()}
              >
                {t("cockpit.printPdf")}
              </button>
              <button className="cta secondary" onClick={() => setState(resetBuilderState())}>
                {t("cockpit.resetBtn")}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="layout">
      {renderSidebar()}
      <main className="main">
        {renderHero()}
        {renderClientSection()}
        {renderPackSection()}
        {renderDomainSection()}
        {renderNeedSection()}
        {renderPricingSection()}
        {/* Section ROI ADAI masquée sur l'écran client (données internes) — réactiver ici si besoin */}
        {/* {renderRoiAdaiSection()} */}
        {renderRoiClientSection()}
        {renderCockpitSection()}
      </main>
    </div>
  );
}
