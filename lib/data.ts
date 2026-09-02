export const DELIVERY_MODES = [
  "SCRATCH",
  "PARTIAL_REUSE",
  "CORE_REUSE",
  "SAAS_ADAPT",
  "STANDARD_DEPLOY",
] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export type PackKey = "start" | "grow" | "scale";

export type Pack = {
  label: string;
  base: number;
  maint: number;
  baseDays: Record<DeliveryMode, number>;
};

export const PACKS: Record<PackKey, Pack> = {
  start: {
    label: "START",
    base: 3500,
    maint: 200,
    baseDays: {
      SCRATCH: 14,
      PARTIAL_REUSE: 8,
      CORE_REUSE: 6,
      SAAS_ADAPT: 4,
      STANDARD_DEPLOY: 3,
    },
  },
  grow: {
    label: "GROW",
    base: 4500,
    maint: 350,
    baseDays: {
      SCRATCH: 24,
      PARTIAL_REUSE: 12,
      CORE_REUSE: 8,
      SAAS_ADAPT: 5,
      STANDARD_DEPLOY: 4,
    },
  },
  scale: {
    label: "SCALE",
    base: 7000,
    maint: 600,
    baseDays: {
      SCRATCH: 40,
      PARTIAL_REUSE: 22,
      CORE_REUSE: 14,
      SAAS_ADAPT: 8,
      STANDARD_DEPLOY: 6,
    },
  },
};

export type ModuleItem = {
  id: string;
  name: string;
  desc: string;
  build: number;
  maint: number;
};

export type Domain = {
  key: string;
  name: string;
  desc: string;
  type: "Métier" | "Transversal";
  mods: ModuleItem[];
};

export const DOMAINS: Domain[] = [
  {
    key: "crm",
    name: "CRM & Commercial",
    desc: "Prospects, opportunités, clients et commandes",
    type: "Métier",
    mods: [
      { id: "crm_prospects", name: "Prospects & opportunités", desc: "Pipeline, qualification et suivi commercial", build: 500, maint: 30 },
      { id: "crm_clients", name: "Clients & fiches", desc: "Référentiel client, historique, segmentation", build: 600, maint: 50 },
      { id: "crm_quotes", name: "Devis & commandes", desc: "Devis, validation, commande et suivi", build: 500, maint: 30 },
      { id: "crm_contracts", name: "Contrats & relances", desc: "Contrats, échéances, relances", build: 400, maint: 25 },
      { id: "crm_reporting", name: "Reporting commercial", desc: "KPI, conversion, activité commerciale", build: 400, maint: 30 },
    ],
  },
  {
    key: "purchasing",
    name: "Achats & Approvisionnement",
    desc: "Fournisseurs, demandes, commandes et réception",
    type: "Métier",
    mods: [
      { id: "pur_suppliers", name: "Fournisseurs", desc: "Référentiel et suivi fournisseurs", build: 400, maint: 25 },
      { id: "pur_requests", name: "Demandes d'achat", desc: "Workflow de demande et validation", build: 450, maint: 30 },
      { id: "pur_orders", name: "Commandes & réceptions", desc: "Commandes, réception, écarts", build: 550, maint: 40 },
      { id: "pur_reporting", name: "Pilotage achats", desc: "Budget, alertes et reporting", build: 400, maint: 30 },
    ],
  },
  {
    key: "finance",
    name: "Finance & DAF",
    desc: "Facturation, trésorerie et reporting",
    type: "Métier",
    mods: [
      { id: "fin_invoice", name: "Facturation", desc: "Factures, avoirs, échéances", build: 600, maint: 50 },
      { id: "fin_expense", name: "Dépenses & justificatifs", desc: "Dépenses, pièces, validation", build: 450, maint: 35 },
      { id: "fin_cash", name: "Trésorerie", desc: "Encaissements, décaissements, prévision", build: 650, maint: 50 },
      { id: "fin_budget", name: "Budget & reporting DAF", desc: "Budget, écarts, cockpit DAF", build: 650, maint: 60 },
    ],
  },
  {
    key: "hr",
    name: "Ressources Humaines",
    desc: "Collaborateurs, temps, congés et paie",
    type: "Métier",
    mods: [
      { id: "hr_people", name: "Collaborateurs", desc: "Dossiers collaborateurs et documents", build: 500, maint: 40 },
      { id: "hr_time", name: "Temps & pointage", desc: "Temps, planning et suivi", build: 550, maint: 40 },
      { id: "hr_leave", name: "Congés & absences", desc: "Demandes, validations, calendrier", build: 450, maint: 30 },
      { id: "hr_payroll", name: "Paie / variables", desc: "Variables et export paie", build: 600, maint: 45 },
      { id: "hr_reporting", name: "Reporting RH", desc: "Effectifs, capacité, absentéisme", build: 450, maint: 35 },
    ],
  },
  {
    key: "stock",
    name: "Stock & Logistique",
    desc: "Stocks, mouvements, livraisons et traçabilité",
    type: "Métier",
    mods: [
      { id: "stk_catalog", name: "Articles & stocks", desc: "Référentiel, niveaux de stock", build: 500, maint: 40 },
      { id: "stk_inventory", name: "Inventaire", desc: "Inventaires et écarts", build: 450, maint: 30 },
      { id: "stk_moves", name: "Mouvements & livraisons", desc: "Entrées, sorties, transferts", build: 600, maint: 45 },
      { id: "stk_trace", name: "Traçabilité & alertes", desc: "Lots, seuils, historique", build: 550, maint: 40 },
    ],
  },
  {
    key: "production",
    name: "Production & Opérations",
    desc: "Processus, qualité et exécution",
    type: "Métier",
    mods: [
      { id: "ops_workflow", name: "Process métier", desc: "Étapes, statuts, règles", build: 600, maint: 45 },
      { id: "ops_execution", name: "Exécution opérationnelle", desc: "Ordres, suivi, incidents", build: 650, maint: 50 },
      { id: "ops_quality", name: "Qualité & contrôle", desc: "Contrôles, anomalies, actions", build: 550, maint: 40 },
      { id: "ops_reporting", name: "Pilotage opérations", desc: "KPI, alertes, performance", build: 500, maint: 40 },
    ],
  },
  {
    key: "projects",
    name: "Projets & Équipes",
    desc: "Tâches, capacité, temps et jalons",
    type: "Métier",
    mods: [
      { id: "prj_projects", name: "Projets & tâches", desc: "Backlog, tâches, statuts", build: 550, maint: 40 },
      { id: "prj_capacity", name: "Ressources & capacité", desc: "Affectations et charge", build: 550, maint: 40 },
      { id: "prj_time", name: "Temps & suivi", desc: "Temps passé, planifié, écarts", build: 450, maint: 30 },
      { id: "prj_milestone", name: "Jalons & reporting", desc: "Jalons, alertes, avancement", build: 450, maint: 35 },
    ],
  },
  {
    key: "service",
    name: "Service Client",
    desc: "Tickets, portail, SAV et satisfaction",
    type: "Métier",
    mods: [
      { id: "svc_ticket", name: "Tickets & demandes", desc: "Demandes, statuts, SLA", build: 500, maint: 40 },
      { id: "svc_portal", name: "Portail client", desc: "Espace, historique, documents", build: 650, maint: 60 },
      { id: "svc_satisfaction", name: "Satisfaction & SAV", desc: "Enquêtes, SAV, suivi", build: 450, maint: 30 },
    ],
  },
  {
    key: "direction",
    name: "Direction & Pilotage",
    desc: "KPI, décisions et consolidation",
    type: "Métier",
    mods: [
      { id: "dir_cockpit", name: "Cockpit clients & activité", desc: "Vue opérationnelle, fiches et suivi", build: 1100, maint: 150 },
      { id: "dir_dashboard", name: "Dashboard dirigeant & alertes", desc: "KPI, alertes et pilotage dirigeant", build: 500, maint: 100 },
      { id: "dir_consolidation", name: "Consolidation", desc: "Multi-sites / entités, synthèses", build: 700, maint: 80 },
    ],
  },
  {
    key: "site",
    name: "Site / Portail digital",
    desc: "Site, formulaires et espaces externes",
    type: "Transversal",
    mods: [
      { id: "site_premium", name: "Site vitrine premium", desc: "Accueil, services, contact, structure évolutive", build: 1200, maint: 0 },
      { id: "site_forms", name: "Formulaires & demandes", desc: "Collecte structurée et qualification", build: 400, maint: 20 },
      { id: "site_client", name: "Espace client / partenaire", desc: "Accès sécurisé et services externes", build: 700, maint: 60 },
    ],
  },
  {
    key: "ecommerce",
    name: "E-commerce",
    desc: "Catalogue, commande et paiement",
    type: "Transversal",
    mods: [
      { id: "eco_catalog", name: "Catalogue e-commerce", desc: "Produits / services, recherche", build: 600, maint: 40 },
      { id: "eco_order", name: "Commande & panier", desc: "Commande et parcours d'achat", build: 700, maint: 50 },
      { id: "eco_payment", name: "Paiement en ligne", desc: "Stripe / PayPal / Mobile Money", build: 600, maint: 50 },
    ],
  },
  {
    key: "planning",
    name: "Planning & Réservation",
    desc: "Créneaux, ressources, abonnements et réservations",
    type: "Transversal",
    mods: [
      { id: "plan_booking", name: "Planning, réservations & abonnements", desc: "Salariés, salles, créneaux, réservation, renouvellement", build: 900, maint: 100 },
      { id: "plan_resources", name: "Gestion des ressources", desc: "Salles, équipements, capacité", build: 450, maint: 30 },
      { id: "plan_reminders", name: "Rappels & no-show", desc: "Rappels, annulations, listes d'attente", build: 350, maint: 25 },
    ],
  },
  {
    key: "ged",
    name: "Documents & GED",
    desc: "Centralisation, génération, signature et accès",
    type: "Transversal",
    mods: [
      { id: "ged_store", name: "GED / classement", desc: "Documents, dossiers, recherche", build: 500, maint: 40 },
      { id: "ged_generate", name: "Génération documentaire", desc: "Modèles, PDF, documents auto", build: 450, maint: 30 },
      { id: "ged_sign", name: "Signature", desc: "Workflow de signature", build: 450, maint: 30 },
    ],
  },
  {
    key: "automation",
    name: "Workflow & Automatisation",
    desc: "Règles, validations et automatisations inter-outils",
    type: "Transversal",
    mods: [
      { id: "auto_simple", name: "Automatisations simples", desc: "Rappels, notifications, actions automatiques", build: 450, maint: 35 },
      { id: "auto_multi", name: "Automatisations multi-outils", desc: "n8n / API / orchestration", build: 700, maint: 60 },
      { id: "auto_validation", name: "Workflows & validations", desc: "Étapes, règles, approbations", build: 550, maint: 40 },
    ],
  },
  {
    key: "communication",
    name: "Communication & Notifications",
    desc: "Email, SMS, WhatsApp et alertes",
    type: "Transversal",
    mods: [
      { id: "com_meta", name: "Pack Meta + WhatsApp + Google Business", desc: "Canaux commerciaux essentiels", build: 800, maint: 0 },
      { id: "com_notify", name: "Notifications Email/SMS", desc: "Alertes et notifications transactionnelles", build: 400, maint: 30 },
      { id: "com_whatsapp", name: "WhatsApp métier", desc: "Messages, relances, interaction client", build: 500, maint: 45 },
    ],
  },
  {
    key: "data",
    name: "Data & BI",
    desc: "Sources, KPI, tableaux de bord et reporting",
    type: "Transversal",
    mods: [
      { id: "data_basic", name: "Reporting & KPI", desc: "Rapports et indicateurs standards", build: 500, maint: 40 },
      { id: "data_advanced", name: "BI avancée", desc: "Analyse multi-source, reporting avancé", build: 900, maint: 100 },
      { id: "data_realtime", name: "Données temps réel", desc: "Actualisation et alertes temps réel", build: 700, maint: 60 },
    ],
  },
  {
    key: "integration",
    name: "Intégrations & API",
    desc: "Connexion CRM, ERP, paiement et outils tiers",
    type: "Transversal",
    mods: [
      { id: "api_one", name: "1–2 intégrations", desc: "Connexion de systèmes standards", build: 500, maint: 35 },
      { id: "api_multi", name: "3–5 intégrations", desc: "Intégrations multiples / synchronisation", build: 900, maint: 70 },
      { id: "api_complex", name: "API / intégration complexe", desc: "API spécifique, mapping complexe", build: 1200, maint: 90 },
    ],
  },
  {
    key: "ai",
    name: "IA & Agents IA",
    desc: "Assistant, analyse, génération et agents métier",
    type: "Transversal",
    mods: [
      { id: "ai_assistant", name: "Assistant IA", desc: "Recherche, rédaction, synthèse", build: 600, maint: 60 },
      { id: "ai_agent", name: "Agent IA métier", desc: "Actions guidées et contexte métier", build: 1000, maint: 100 },
      { id: "ai_multi", name: "Architecture multi-agents", desc: "Orchestration de plusieurs agents", build: 1600, maint: 160 },
    ],
  },
  {
    key: "security",
    name: "Sécurité & Accès",
    desc: "Rôles, permissions et données sensibles",
    type: "Transversal",
    mods: [
      { id: "sec_roles", name: "Rôles & permissions", desc: "Profils, accès, périmètres", build: 450, maint: 30 },
      { id: "sec_auth", name: "Authentification renforcée", desc: "MFA / SSO / politiques", build: 650, maint: 45 },
      { id: "sec_sensitive", name: "Données sensibles", desc: "Contrôles et durcissement", build: 900, maint: 70 },
    ],
  },
  {
    key: "multisite",
    name: "Multi-sites / Multi-entités",
    desc: "Déploiement, consolidation et reporting groupe",
    type: "Transversal",
    mods: [
      { id: "multi_sites", name: "Multi-sites", desc: "Plusieurs lieux / salles / implantations", build: 1200, maint: 150 },
      { id: "multi_entities", name: "Multi-entités", desc: "Entités, droits et consolidation", build: 1400, maint: 170 },
      { id: "multi_country", name: "Multi-pays", desc: "Localisation, droits, consolidation internationale", build: 1800, maint: 200 },
    ],
  },
  {
    key: "regulatory",
    name: "Reporting réglementaire / métier",
    desc: "Rapports spécifiques au secteur ou à la gouvernance",
    type: "Transversal",
    mods: [
      { id: "reg_standard", name: "Reporting métier spécifique", desc: "Rapports et exports dédiés", build: 600, maint: 45 },
      { id: "reg_advanced", name: "Reporting réglementaire avancé", desc: "Contrôles et formats spécifiques", build: 1000, maint: 80 },
    ],
  },
];

// Editable commercial catalogue (V1: name/build/maint/active, admin-modifiable — see
// lib/server/catalog.ts). DOMAINS above is used ONLY as (a) the seed default for the DB
// table and (b) the fallback default parameter of calculate()/these types below — no
// runtime code path other than the seed script and getCatalog()'s empty-DB bootstrap may
// read module build/maint directly from DOMAINS for actual pricing after seeding.
export type CatalogModule = ModuleItem & { active: boolean };
export type CatalogDomain = Omit<Domain, "mods"> & { mods: CatalogModule[] };

export function defaultCatalogDomains(): CatalogDomain[] {
  return DOMAINS.map((d) => ({ ...d, mods: d.mods.map((m) => ({ ...m, active: true })) }));
}

export const PRESETS: Record<PackKey, string[]> = {
  start: ["site_premium", "com_meta", "crm_clients", "dir_dashboard"],
  grow: ["site_premium", "com_meta", "dir_cockpit", "plan_booking", "dir_dashboard"],
  scale: ["dir_cockpit", "dir_dashboard", "dir_consolidation", "data_advanced", "api_multi", "multi_sites", "ai_assistant", "sec_roles"],
};
