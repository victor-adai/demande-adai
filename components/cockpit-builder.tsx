"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DOMAINS, PACKS, type PackKey } from "@/lib/data";
import {
  calculate,
  applyPreset,
  euro,
  pct,
  buildPayload,
} from "@/lib/engine";
import type { BuilderState, CalculationResult } from "@/lib/types";

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

function toggleDomainModules(state: BuilderState, domainKey: string, checked: boolean): BuilderState {
  const selected = new Set(state.selectedModules);
  const domain = DOMAINS.find((d) => d.key === domainKey);
  if (!domain) return state;
  for (const mod of domain.mods) {
    if (checked) selected.add(mod.id);
    else selected.delete(mod.id);
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

export default function CockpitBuilder() {
  const [state, setState] = useState<BuilderState>(() => ({
    ...initialState,
    selectedModules: new Set<string>(),
    openDomains: new Set<string>(),
  }));

  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const result = useMemo<CalculationResult>(() => calculate(state), [state]);

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
          ΛDΛI<small>THINK • BUILD • SCALE</small>
        </div>
        <div className="sideTag">
          <b>V6 MASTER</b>
          <span>Front + Back • Packs • Domaines • ROI ADAI • ROI Client</span>
        </div>
        <p className="navTitle">Parcours</p>
        <nav className="nav">
          <a href="#client"><span className="num">01</span>Connaître le client</a>
          <a href="#packs"><span className="num">02</span>Socle d&apos;offre</a>
          <a href="#domains"><span className="num">03</span>Domaines & modules</a>
          <a href="#need"><span className="num">04</span>Besoin & existant</a>
          <a href="#pricing"><span className="num">05</span>Prix & delivery</a>
          {/* Lien ROI ADAI masqué sur l'écran client — réactiver avec la section renderRoiAdaiSection() */}
          {/* <a href="#roi-adai"><span className="num">06</span>ROI ADAI</a> */}
          <a href="#roi-client"><span className="num">06</span>ROI client</a>
          <a href="#cockpit"><span className="num">07</span>Cockpit & export</a>
        </nav>
        <div className="sideKpis">
          <div className="sideKpi"><span>Pack</span><b>{PACKS[result.forcedPack].label}</b></div>
          <div className="sideKpi"><span>Prix</span><b>{euro(result.commercialPrice)}</b></div>
          <div className="sideKpi"><span>Jours</span><b>{result.estimatedDays} j</b></div>
          <div className="sideKpi"><span>Markup</span><b>{pct(result.markupPercent)}</b></div>
        </div>
      </aside>
    );
  }

  function renderHero() {
    return (
      <section className="hero">
        <div className="card heroMain">
          <div className="kicker">Cockpit Builder ADAI — V6 MASTER</div>
          <h1>
            Qualifier. Configurer. <span>Rentabiliser.</span>
          </h1>
          <p className="lead">
            Base opérationnelle du Cockpit Builder ADAI : le Front reste simple pour le client, le Back conserve le détail fonctionnel,
            la valeur catalogue, la charge de delivery, la rentabilité ADAI et le ROI client validé en revue.
          </p>
          <div className="chips">
            <span className="chip">START 3 500 €</span>
            <span className="chip">GROW 4 500 €</span>
            <span className="chip">SCALE 7 000 €</span>
          </div>
        </div>
        <div className="card why">
          <h2>Règle V6</h2>
          <p>La complexité client, le temps de production ADAI, le prix de vente et la valeur client sont quatre dimensions distinctes.</p>
          <div className="reason">
            <div className="mark">01</div>
            <div><b>Valeur catalogue</b><span>Somme des briques et adaptations du périmètre.</span></div>
          </div>
          <div className="reason">
            <div className="mark">02</div>
            <div><b>Rentabilité interne</b><span>Le prix final doit respecter le floor ADAI et le markup cible.</span></div>
          </div>
          <div className="reason">
            <div className="mark">03</div>
            <div><b>ROI client contrôlé</b><span>Les hypothèses ne deviennent visibles qu&apos;après validation ADAI.</span></div>
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
            <option key={opt}>{opt}</option>
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
            <h2>01 — Connaître le client</h2>
            <p>Étoffe le socle entreprise sans confondre effectif, personnes impactées et utilisateurs directs.</p>
          </div>
        </div>
        <div className="card formCard">
          <div className="formGrid">
            {clientField("Nom de l'entreprise", "companyName", "text")}
            {clientField("Projet", "projectName", "text")}
            {clientField("Secteur d'activité", "industry", "text")}
            {clientField("Sous-secteur / métier", "subIndustry", "text")}
            {clientField(
              "CA annuel",
              "revenue",
              "select",
              ["< 100 k€", "100–500 k€", "500 k€–2 M€", "2–10 M€", "10 M€+"]
            )}
            {clientField(
              "Effectif total",
              "companySize",
              "select",
              ["1–10", "11–25", "26–50", "51–100", "101–250", "250+"]
            )}
            {clientField(
              "Personnes concernées par le besoin",
              "impactedPeople",
              "select",
              ["1–3", "4–10", "11–25", "26–50", "51–100", "100+"]
            )}
            {clientField(
              "Utilisateurs directs de la solution",
              "solutionUsers",
              "select",
              ["1–10", "11–25", "26–50", "51–100", "101–250", "250+"]
            )}
            {clientField(
              "Organisation",
              "organization",
              "select",
              ["Mono-site / 1 entité", "Multi-sites", "Multi-entités", "Groupe / réseau", "Multi-pays"]
            )}
            {clientField("Nombre de sites", "siteCount", "number")}
            {clientField("Nombre d'entités", "entityCount", "number")}
            {clientField("Pays concernés", "countries", "select", ["1 pays", "2–3 pays", "4+ pays"])}
            {clientField("Maturité digitale", "digitalMaturity", "select", ["Faible", "Intermédiaire", "Avancée"])}
            {clientField("Équipe IT", "itCapacity", "select", ["Aucune", "Prestataire", "Interne", "Mixte"])}
            {clientField("Priorité", "priority", "select", ["Faible", "Moyenne", "Forte", "Critique"])}
            {clientField("Délai souhaité", "timeline", "select", ["< 1 mois", "1–3 mois", "3–6 mois", "6 mois+"])}
            {clientField(
              "Budget envisagé",
              "budget",
              "select",
              ["Non communiqué", "< 3 500 €", "3 500–7 000 €", "7 000–15 000 €", "15 000 €+"]
            )}
            {clientField("Outils actuels", "currentTools", "text", undefined, true)}
            {clientField("Qu'est-ce qui coûte aujourd'hui le plus de temps ou d'argent ?", "painPoints", "text", undefined, false, true)}
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
            <h2>02 — Socle d&apos;offre</h2>
            <p>Les trois packs sont des références commerciales. Le périmètre réel reste ajustable module par module.</p>
          </div>
        </div>
        <div className="packGrid">
          {(Object.keys(PACKS) as PackKey[]).map((key) => {
            const pack = PACKS[key];
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
                  {key === "start" && "Digitaliser & centraliser"}
                  {key === "grow" && "Structurer & piloter"}
                  {key === "scale" && "Industrialiser & consolider"}
                </h3>
                <p>
                  {key === "start" &&
                    "Un premier système métier cadré, mono-site, avec peu d'intégrations et une personnalisation limitée."}
                  {key === "grow" &&
                    "Un système métier opérationnel avec cockpit, workflow, automatisations et pilotage quotidien."}
                  {key === "scale" &&
                    "Multi-sites / entités, API, Data/BI, IA avancée, sécurité et consolidation."}
                </p>
                <div className="price">{pack.base.toLocaleString("fr-FR")} €</div>
                <div className="maint">
                  {key === "start" && "Maintenance indicative : 150–200 €/mois selon périmètre"}
                  {key === "grow" && "Maintenance de référence : 350 €/mois"}
                  {key === "scale" && "Maintenance indicative : ≈700 €/mois selon périmètre"}
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
            <h2>03 — Domaines & modules</h2>
            <p>9 domaines métier de Victor + domaines transversaux ADAI. Chaque sélection alimente le périmètre et la valeur catalogue.</p>
          </div>
        </div>
        <div className="domainToolbar">
          <button className="miniBtn" onClick={() => setState((prev) => applyPresetToState(prev, result.forcedPack))}>
            Recharger le preset du pack
          </button>
          <button
            className="miniBtn"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                openDomains: new Set(DOMAINS.map((d) => d.key)),
              }))
            }
          >
            Tout ouvrir
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
            Réinitialiser les modules
          </button>
        </div>
        <div className="domainGrid">
          {DOMAINS.map((domain) => {
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
                    onChange={(e) => setState((prev) => toggleDomainModules(prev, domain.key, e.target.checked))}
                  />
                  <div>
                    <b>{domain.name}</b>
                    <span>{domain.type} — {domain.desc}</span>
                  </div>
                </label>
                <div className="modules">
                  {domain.mods.map((mod) => (
                    <label className="moduleLine" key={mod.id}>
                      <input
                        type="checkbox"
                        className="moduleCheck"
                        data-id={mod.id}
                        checked={state.selectedModules.has(mod.id)}
                        onChange={() => setState((prev) => toggleModule(prev, mod.id))}
                      />
                      <div>
                        <b>{mod.name}</b>
                        <span>{mod.desc}</span>
                      </div>
                      <div className="modulePrice">+{euro(mod.build)}</div>
                    </label>
                  ))}
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
            <h2>04 — Besoin, existant & complexité</h2>
            <p>Questions complémentaires utilisées pour justifier le pack et préparer le delivery.</p>
          </div>
        </div>
        <div className="card formCard">
          <div className="formGrid">
            <div className="field full">
              <label htmlFor="needDescription">Description du besoin / objectif</label>
              <textarea
                id="needDescription"
                value={state.need.description}
                onChange={(e) => setState((prev) => updateNeed(prev, "description", e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="currentProcess">Process actuel</label>
              <select
                id="currentProcess"
                value={state.need.currentProcess}
                onChange={(e) => setState((prev) => updateNeed(prev, "currentProcess", e.target.value))}
              >
                <option>Majoritairement manuel</option>
                <option>Mixte manuel + outils</option>
                <option>Déjà digitalisé</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="migration">Migration de données</label>
              <select
                id="migration"
                value={state.need.migration}
                onChange={(e) => setState((prev) => updateNeed(prev, "migration", e.target.value))}
              >
                <option>Aucune / légère</option>
                <option>Simple</option>
                <option>Multi-sources</option>
                <option>Complexe</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="customization">Niveau de personnalisation</label>
              <select
                id="customization"
                value={state.need.customization}
                onChange={(e) => setState((prev) => updateNeed(prev, "customization", e.target.value))}
              >
                <option>Standard</option>
                <option>Adaptation légère</option>
                <option>Adaptation significative</option>
                <option>Spécifique</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="sensitive">Données sensibles</label>
              <select
                id="sensitive"
                value={state.need.sensitive}
                onChange={(e) => setState((prev) => updateNeed(prev, "sensitive", e.target.value))}
              >
                <option>Non</option>
                <option>Oui</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="roles">Rôles / permissions</label>
              <select
                id="roles"
                value={state.need.roles}
                onChange={(e) => setState((prev) => updateNeed(prev, "roles", e.target.value))}
              >
                <option>1 rôle</option>
                <option>2–3 rôles</option>
                <option>4+ rôles</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="deliveryMode">Mode de delivery ADAI</label>
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
              <div className="hint">Exemple : SAAS_ADAPT = socle existant, adaptation Front + Back limitée.</div>
            </div>
            <div className="field">
              <label htmlFor="integrationCount">Intégrations externes estimées</label>
              <input
                id="integrationCount"
                type="number"
                min={0}
                value={state.need.integrationCount}
                onChange={(e) => setState((prev) => updateNeed(prev, "integrationCount", Number(e.target.value)))}
              />
            </div>
            <div className="field">
              <label htmlFor="volume">Volumétrie</label>
              <select
                id="volume"
                value={state.need.volume}
                onChange={(e) => setState((prev) => updateNeed(prev, "volume", e.target.value))}
              >
                <option>Faible</option>
                <option>Moyenne</option>
                <option>Élevée</option>
                <option>Très élevée</option>
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
              <h2>05 — Prix & delivery</h2>
              <p>Le prix commercial vient du périmètre. Le delivery sert à contrôler le coût interne, pas à fixer mécaniquement la valeur client.</p>
            </div>
          </div>
          <div className="card formCard">
            <div className="formGrid">
              <div className="field">
                <label htmlFor="discountRate">Bonus / remise commerciale</label>
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
                <label htmlFor="productiveDays">Jours productifs / mois</label>
                <input
                  id="productiveDays"
                  type="number"
                  min={1}
                  value={state.pricing.productiveDays}
                  onChange={(e) => setState((prev) => updatePricing(prev, "productiveDays", Number(e.target.value)))}
                />
              </div>
              <div className="field">
                <label htmlFor="deliveryConfidence">Confiance delivery</label>
                <select
                  id="deliveryConfidence"
                  value={state.pricing.deliveryConfidence}
                  onChange={(e) => setState((prev) => updatePricing(prev, "deliveryConfidence", e.target.value))}
                >
                  <option>Faible</option>
                  <option>Moyenne</option>
                  <option>Haute</option>
                </select>
              </div>
            </div>
            <div className="divider" />
            <div className="metricGrid">
              <div className="metric"><span>Valeur modules</span><b>{euro(result.functionalValue)}</b></div>
              <div className="metric"><span>Ajustement complexité</span><b>{result.complexityAdjustment ? `+${euro(result.complexityAdjustment)}` : euro(0)}</b></div>
              <div className="metric"><span>Valeur catalogue</span><b>{euro(result.catalogValue)}</b></div>
              <div className="metric"><span>Delivery estimé</span><b>{hasQualifiedScope ? `${result.estimatedDays} j` : "À estimer"}</b></div>
            </div>
            <div className="divider" />
            <div className="subtle">
              Le prix commercial est calculé à partir de la valeur catalogue des modules sélectionnés, des ajustements de complexité et de la remise appliquée.
            </div>
          </div>
        </div>

        <aside className="sticky">
          <div className="card summary">
            <div className="summaryTop">
              <small>PROPOSITION ACTIVE</small>
              <h2 style={{ margin: "6px 0 0" }}>{PACKS[result.forcedPack].label}</h2>
              <div className="summaryPrice">{hasQualifiedScope ? euro(result.commercialPrice) : "À calculer"}</div>
              <small>Valeur catalogue après remise autorisée.</small>
            </div>
            <div className="row"><span>Socle pack</span><b>{euro(PACKS[result.forcedPack].base)}</b></div>
            <div className="row"><span>Valeur catalogue</span><b>{euro(result.catalogValue)}</b></div>
            <div className="row"><span>Remise</span><b>{Math.round(state.pricing.discountRate * 100)} %</b></div>
            <div className="row"><span>Maintenance</span><b>{euro(result.maintenanceYear1Monthly)}/mois</b></div>
            <div className="row"><span>Année 1</span><b>{euro(result.year1Revenue)}</b></div>
            <div className="row"><span>Statut marge</span><b>{!hasQualifiedScope ? <span className="badge amber">EN ATTENTE</span> : result.gate ? <span className="badge green">MARGE VALIDÉE</span> : <span className="badge red">À REVOIR</span>}</b></div>
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
            <h2>06 — ROI client</h2>
            <p>La simulation complète est réservée à la revue avec le client. ADAI calibre les hypothèses avant exposition.</p>
          </div>
          <span className="badge amber">REVUE CLIENT</span>
        </div>
        <div className="roiClient">
          <div className="toggleLine">
            <div>
              <label htmlFor="roiValidated"><b>Hypothèses ROI validées par ADAI</b></label>
              <div className="hint">Activer uniquement lorsque les hypothèses sont plausibles et discutées en revue.</div>
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
                ["weeklyHours", "Heures hebdomadaires répétitives / collaborateur", 0, 0.5],
                ["roiPeople", "Collaborateurs concernés", 1, 1],
                ["hourlyCost", "Coût horaire chargé (€)", 0, 1],
                ["automationRate", "Taux d'automatisation validé", 0, 1],
                ["realizationRate", "Taux de réalisation économique", 0, 1],
                ["errorsAvoided", "Erreurs évitées / an", 0, 1],
                ["errorCost", "Coût moyen par erreur (€)", 0, 1],
                ["toolSavings", "Économies outils / an (€)", 0, 1],
                ["additionalRevenue", "CA additionnel estimé / an (€)", 0, 1],
                ["contributionMargin", "Taux de marge contributive", 0, 1],
                ["fteHours", "Référence heures / ETP / an", 1, 1],
                ["activeWeeks", "Semaines actives", 1, 1],
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
                <div className="metric"><span>Heures récupérables</span><b>{Math.round(result.hoursSaved).toLocaleString("fr-FR")} h/an</b></div>
                <div className="metric"><span>Valeur brute du temps</span><b>{euro(result.grossTimeValue)}/an</b></div>
                <div className="metric"><span>Valeur économique réalisée</span><b>{euro(result.realizedAnnualValue)}/an</b></div>
                <div className="metric"><span>Équivalent temps plein</span><b>{(Math.round(result.fteEquivalent * 10) / 10).toLocaleString("fr-FR")} ETP</b></div>
              </div>
              <div className="metricGrid">
                <div className="metric"><span>Investissement année 1</span><b>{euro(result.clientInvestment)}</b></div>
                <div className="metric"><span>Gain net année 1</span><b>{euro(result.clientNetGain)}</b></div>
                <div className="metric"><span>ROI client</span><b>{pct(result.clientRoiPercent)}</b></div>
                <div className="metric"><span>Payback</span><b>{(Math.round(result.paybackMonths * 10) / 10).toLocaleString("fr-FR")} mois</b></div>
              </div>
            </div>
          ) : (
            <div className="roiLocked">🔒 Simulation masquée : valider les hypothèses ADAI pour afficher le ROI au client.</div>
          )}
        </div>
      </section>
    );
  }

  function renderCockpitSection() {
    const payload = buildPayload(state, result);
    const json = JSON.stringify(payload, null, 2);
    return (
      <section id="cockpit" className="section">
        <div className="sectionHeader">
          <div>
            <h2>07 — Cockpit & export</h2>
            <p>Synthèse exploitable par Victor : données Front, moteur Back, proposition commerciale, rentabilité et ROI.</p>
          </div>
        </div>
        <div className="twoCol">
          <div className="card formCard">
            <h3 style={{ marginTop: 0 }}>Lecture Cockpit</h3>
            <div className="row"><span>Entreprise</span><b>{state.client.companyName} — {state.client.industry}</b></div>
            <div className="row"><span>Pack recommandé / actif</span><b>{PACKS[result.forcedPack].label}</b></div>
            <div className="row"><span>Domaines concernés</span><b>{result.activeDomainNames.length}</b></div>
            <div className="row"><span>Modules retenus</span><b>{result.selectedIds.length}</b></div>
            <div className="row"><span>Prix catalogue</span><b>{euro(result.catalogValue)}</b></div>
            <div className="row"><span>Prix commercial</span><b>{hasQualifiedScope ? euro(result.commercialPrice) : "À calculer"}</b></div>
            <div className="row"><span>Delivery</span><b>{hasQualifiedScope ? `${result.estimatedDays} j — ${state.need.deliveryMode}` : "À estimer"}</b></div>
            <div className="row"><span>ROI ADAI</span><b>{hasQualifiedScope ? `${result.gate ? "GO" : "À REVOIR"} — markup ${pct(result.markupPercent)}` : "En attente"}</b></div>
            <div className="row"><span>ROI client</span><b>{!hasQualifiedScope ? "À valider" : state.roiClient.roiValidated ? `${pct(result.clientRoiPercent)} — payback ${(Math.round(result.paybackMonths * 10) / 10)} mois` : "À valider en revue"}</b></div>
            <div className="divider" />
            <div className="pillList">
              {result.selectedIds.map((id) => {
                const mod = DOMAINS.flatMap((d) => d.mods).find((m) => m.id === id);
                return mod ? <span className="pill" key={id}>{mod.name}</span> : null;
              })}
            </div>
          </div>
          <div className="card formCard">
            <h3 style={{ marginTop: 0 }}>Export JSON</h3>
            <textarea className="jsonBox" readOnly value={json} />
            <div className="ctaRow" style={{ marginTop: 12 }}>
              <button
                className="cta primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(json);
                    alert("JSON copié.");
                  } catch {
                    // fallback not needed in modern browsers
                  }
                }}
              >
                Copier JSON
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
                Télécharger JSON
              </button>
              <button
                className="cta secondary"
                onClick={() => {
                  try {
                    localStorage.setItem(`ADAI_V6_${state.client.projectName || "projet"}`, json);
                    alert("Demande client sauvegardée localement.");
                  } catch {
                    alert("Erreur de sauvegarde.");
                  }
                }}
              >
                Sauvegarder demande client
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
                  ? "Envoi..."
                  : submitStatus === "sent"
                    ? "Envoyée ✓"
                    : submitStatus === "error"
                      ? "Erreur — réessayer"
                      : "Envoyer à ADAI"}
              </button>
              <button
                className="cta secondary"
                onClick={() => window.print()}
              >
                Imprimer demande client / PDF
              </button>
              <button className="cta secondary" onClick={() => setState(resetBuilderState())}>
                Réinitialiser
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
