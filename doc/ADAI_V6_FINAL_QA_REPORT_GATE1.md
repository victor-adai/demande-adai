# WALLY THINK — FINAL QA REVIEW
### V6 GENERIC / GATE 1

> **MISE À JOUR — P1 EMPTY DISPLAY STATE CORRIGÉ.** Suite à l'arbitrage THINK ("SPEC IS VALID, real P1 display defect, do NOT modify the engine, implement DISPLAY STATE only"), le correctif a été implémenté, testé et validé. Voir section dédiée en fin de document. **OPEN P1 = 0. GATE 1 = PASS CANDIDATE.**

> Correction préalable au template de revue : le total est **58 tests** (55 + 3 nouveaux tests EMPTY DISPLAY STATE), pas 52 — 3 tests (`tests/public-offer.test.ts`) avaient déjà été ajoutés pendant les travaux de backoffice pour couvrir BO-09 (non-fuite ROI ADAI), et 3 tests supplémentaires (`EMPTY DISPLAY STATE`) viennent d'être ajoutés dans `tests/ui.test.tsx`.

---

## FINAL QA MATRIX

| ID | TEST NAME | LAYER | EXPECTED | ACTUAL | RESULT |
|---|---|---|---|---|---|
| TC-01 | Generic initial state | ENGINE | START, 0 module, 0 discount, catalog=0, days=SCRATCH baseline | Conforme (engine.test.ts:129) | PASS |
| TC-02 | GROW selection ≠ preset load | APPLICATION STATE | `currentPack:"grow"` seul → `selectedModules.size===0` | Conforme (engine.test.ts:145) | PASS |
| TC-03 | SCALE selection ≠ preset load | APPLICATION STATE | idem pour SCALE | Conforme (engine.test.ts:153) | PASS |
| TC-PRESET | applyPreset start/grow/scale | APPLICATION STATE | modules = PRESETS[x] exact, discount/deliveryMode corrects | Conforme (engine.test.ts:163-182) | PASS |
| TC-04 | MTMT fixture calibration | ENGINE | forcedPack=grow, catalog=3200, commercial=2560, days=5, markup≈156%, gate=true | Conforme (engine.test.ts:186) | PASS |
| TC-05 | Multi-sites → +250, force GROW | ENGINE | Conforme | engine.test.ts:200 | PASS |
| TC-06 | Multi-entités → +500, force SCALE | ENGINE | Conforme | engine.test.ts:206 | PASS |
| TC-07 | sensitive=Oui → +600, force SCALE | ENGINE | Conforme | engine.test.ts:212 | PASS |
| TC-08 | integrations=3 → +300, force GROW | ENGINE | Conforme | engine.test.ts:218 | PASS |
| TC-09 | integrations=6 → +700, force SCALE | ENGINE | Conforme | engine.test.ts:224 | PASS |
| TC-10 | Advanced module forcing (data_advanced, ai_agent, ai_multi, site_client, auto_multi forcent ; ai_assistant ne force PAS) | ENGINE | 6 sous-cas incl. négatif | Conforme (engine.test.ts:232-259) | PASS |
| TC-11 | Delivery — baselines par mode + malus migration/customization/intégrations + extra catalogue | ENGINE | 6 sous-cas | Conforme (engine.test.ts:264-295) | PASS |
| TC-12 | ROI ADAI GO / FAIL | ENGINE | GO: gate=true ; FAIL: coûts internes élevés → gate=false, floor>commercial | Conforme (engine.test.ts:300, 308 — reconstruit via `withNeed`/`withPricing`, plus de cast) | PASS |
| TC-13A | ROI Client engine (avant/après validation) | ENGINE | avant: roi%=0 (investment=0) ; après: roi/payback/FTE calculés | Conforme (engine.test.ts:339, 346) | PASS |
| TC-13B | ROI Client display lock | DISPLAY STATE | non validé → message masqué visible, aucune métrique ROI dans le DOM ; validé → métriques visibles dans `#roi-client` | Conforme (ui.test.tsx:6, 12) | PASS |
| TC-14 | **REAL RESET ACTION** | APPLICATION STATE | `resetBuilderState()` (fonction réellement bindée au bouton "Réinitialiser", cockpit-builder.tsx:159 & :946) → pack=start, modules=∅, domains=∅, discount=0, client vidé | Conforme (engine.test.ts:379) — preuve directe : le test importe `resetBuilderState` depuis `@/components/cockpit-builder`, pas une factory de test dupliquée | PASS |
| TC-RESET (UI) | Reset via clic bouton réel | UI ACTION | render→sélectionne module→clic GROW→clic "Réinitialiser"→module décoché, pack=START affiché | Conforme (ui.test.tsx:117) | PASS |
| TC-15 | Save client request | UI ACTION | clic "Sauvegarder demande client" → `localStorage.setItem` appelé, clé `ADAI_V6_*`, JSON valide | Conforme (ui.test.tsx:27) | PASS |
| TC-16 | Print / PDF | UI ACTION | clic "Imprimer..." → `window.print()` appelé | Conforme (ui.test.tsx:42) | PASS |
| TC-17A | JSON payload structure | EXPORT | structure complète, ROI client non validé → `status:"PENDING_VALIDATION"`, `roi_percent:null` | Conforme (engine.test.ts:477) | PASS |
| TC-17A-bis | Payload avec ROI validé | EXPORT | `status:"VALIDATED"`, valeurs réelles exposées | Conforme (engine.test.ts:515, ajouté lors du fix sémantique) | PASS |
| TC-17B | Copy JSON | UI ACTION / EXPORT | clic "Copier JSON" → `clipboard.writeText` appelé avec JSON valide, `version:"V6_MASTER"` | Conforme (ui.test.tsx:53) | PASS |
| TC-17C | Download JSON | UI ACTION / EXPORT | clic "Télécharger JSON" → `URL.createObjectURL` appelé, blob `type:"application/json"` | Conforme (ui.test.tsx:68) | PASS |
| TC-MAINT | Maintenance calculation | ENGINE | `maintenanceValue` clamp ≥0 ; MTMT: 250€ public, 200€ an1 après 20% | Conforme (engine.test.ts:415-426) | PASS |
| TC-BOUNDARY | Seuils complexité (intégrations 2/3/5, pays, migration, customization, volume) | ENGINE | 8 sous-cas frontières | Conforme (engine.test.ts:432-472) | PASS |
| TC-DOMAIN | Domain/module sync | UI ACTION / DISPLAY STATE | check module → domaine `.active` ; "Réinitialiser les modules" décoche tout ; "Tout ouvrir" active 21 domaines sans cocher de module | Conforme (ui.test.tsx:85, 94, 105) | PASS |
| BO-09-a | Offre publique — champs exposés | SECURITY | uniquement 9 clés autorisées (company_name, project_name, pack, commercial_price, maintenance_year1_monthly, delivery_days, delivery_confidence, modules, domains) | Conforme (public-offer.test.ts, nouveau) | PASS |
| BO-09-b | Offre publique — absence totale de champs internes | SECURITY | JSON sérialisé ne contient jamais project_cost/floor_price/markup/gross_profit/gross_margin/max_discount_rate/gate/roi_adai/roi_client/resourcePool/structureCost/directionCost | Conforme | PASS |
| BO-09-c | Offre publique — valeurs sanitizées correctes (fixture MTMT) | SECURITY | commercial=2560, maintenance=200, days=5 | Conforme | PASS |

**TOTAL = 58 tests, 58 PASS, 0 FAIL.** *(55 lors de la première passe de cette matrice ; +3 tests EMPTY DISPLAY STATE ajoutés lors de la correction du P1 — voir section dédiée plus bas.)*

---

## MANDATORY CONTROLS — preuves explicites

| Contrôle | Preuve | Statut |
|---|---|---|
| PACK SELECTION ≠ PRESET LOAD | TC-02/TC-03 : sélectionner GROW/SCALE seul → `selectedModules.size===0`, alors que TC-PRESET montre qu'`applyPreset()` peuple bien les modules | PASS |
| MTMT ≠ GROW PRESET | `MTMT_FIXTURE` = 3 modules (`site_premium, dir_cockpit, plan_booking`) ≠ `PRESETS.grow` = 5 modules (`+com_meta, dir_dashboard`) — vérifié par grep direct sur `lib/data.ts` et `tests/fixtures/mtmt.ts` | PASS |
| MTMT production UI | `grep MTMT` sur `components/cockpit-builder.tsx` → **0 résultat** | NO (confirmé) |
| MTMT initialState | `grep MTMT` sur `lib/` (data.ts, engine.ts, types.ts) → **0 résultat** | NO (confirmé) |
| MTMT resetState | `resetBuilderState()` retourne `initialState` (aucune référence MTMT) | NO (confirmé) |
| MTMT fixture only | Seuls `tests/fixtures/mtmt.ts` et les fichiers de test l'importent | YES (confirmé) |
| DOMAIN/MODULE synchronization | TC-DOMAIN (3 sous-tests) | PASS |
| EMPTY DISPLAY STATE | Corrigé — `hasQualifiedScope`, moteur inchangé (voir section dédiée) | PASS |
| ROI ADAI confidentiality | Niveau unitaire : BO-09-a/b/c (PASS). Niveau API : vérifié manuellement (curl, 401 sans session) mais pas encore couvert par un test automatisé | PASS (preuve partielle) |
| Duplicate interactive IDs | Comptage programmatique des `id:` dans `lib/data.ts` : 71 IDs, 71 uniques, 0 doublon | 0 (confirmé) |

### ✅ P1 CORRIGÉ — EMPTY DISPLAY STATE

**Arbitrage THINK reçu :** SPEC IS VALID — défaut d'affichage P1 réel. Ne pas modifier le moteur. Implémenter uniquement la couche DISPLAY STATE.

**Implémentation (`components/cockpit-builder.tsx`) :**

```ts
// DISPLAY STATE ONLY — no engine change.
const hasQualifiedScope = state.selectedModules.size > 0 && result.catalogValue > 0;
```

Condition définie exactement comme demandé par l'arbitrage. Les valeurs internes du moteur (`result`) restent **strictement inchangées** — seul l'affichage conditionnel a été ajouté, à 8 emplacements :

| Emplacement | Avant (valeur brute) | Après (placeholder si `!hasQualifiedScope`) |
|---|---|---|
| Résumé sticky — prix | `euro(result.commercialPrice)` | `"À calculer"` |
| Résumé sticky — statut marge | badge GO/À REVOIR | badge `EN ATTENTE` (ambre) |
| Section 05 — Delivery estimé | `{estimatedDays} j` | `"À estimer"` |
| Section 06 — Markup réel | `pct(markupPercent)` | `"—"` |
| Section 06 — Gate ADAI | badge GO/NO-GO | badge `EN ATTENTE` (ambre) |
| Section 08 — Prix commercial | `euro(commercialPrice)` | `"À calculer"` |
| Section 08 — Delivery | `{days} j — {mode}` | `"À estimer"` |
| Section 08 — ROI ADAI | `GO/À REVOIR — markup X%` | `"En attente"` |
| Section 08 — ROI client | valeur ou `"À valider en revue"` | `"À valider"` |

La section 07 (verrou ROI client / `roiValidated`) n'a **pas** été touchée — c'est un mécanisme distinct déjà validé par TC-13B, non concerné par ce défaut.

**Test automatisé ajouté** (`tests/ui.test.tsx`, describe `"EMPTY DISPLAY STATE — placeholders below a qualified scope"`, 3 tests) :
1. État initial générique → tous les placeholders visibles (PASS).
2. Sélection d'un module réel (`site_premium`) → tous les placeholders disparaissent, remplacés par des valeurs calculées (PASS).
3. Après clic sur "Réinitialiser" → les placeholders réapparaissent (PASS).

**Résultat** : `pnpm test` → **58/58 PASS** (55 précédents + 3 nouveaux). `pnpm build` → **PASS**, 12 routes générées sans erreur.

**OPEN P1 = 0.**

---

## JSDOM WARNING FILTER — preuve

```ts
// tests/setup.ts
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === "string" ? args[0] : args[0] instanceof Error ? args[0].message : "";
  if (message.includes("Not implemented: navigation")) return;
  originalConsoleError(...args);
};
```

Confirmé : le filtre teste une sous-chaîne exacte (`"Not implemented: navigation"`) et relaie tout le reste à `console.error` d'origine (`originalConsoleError(...args)`). `console.warn`, les erreurs non interceptées et les warnings React ne sont **pas** touchés — seul ce message jsdom précis est filtré.

---

## RESET PROOF

Confirmé par lecture directe du code : `resetBuilderState()` (`components/cockpit-builder.tsx:159`) est **exactement** la fonction appelée par `onClick` du bouton "Réinitialiser" (ligne 946) et par l'initialisation du composant. TC-14 importe et invoque cette fonction réelle — ce n'est pas une factory de test dupliquée (`emptyState()` est un helper distinct utilisé pour construire des scénarios ad hoc, jamais substitué au vrai reset dans TC-14 ni TC-RESET).

État attendu vérifié après reset :

| Élément | Attendu | Statut |
|---|---|---|
| pack | START | ✅ |
| modules | [] | ✅ |
| domains | [] | ✅ |
| discount | 0 | ✅ |
| client | vidé | ✅ |
| MTMT | absent | ✅ |
| Affichage (À calculer/À estimer/—/En attente) | placeholders textuels | ✅ implémenté — voir section "P1 CORRIGÉ — EMPTY DISPLAY STATE" plus bas |

---

## FINAL REPORT (mis à jour après correction P1)

```
TOTAL TESTS = 58 (55 précédents + 3 nouveaux tests EMPTY DISPLAY STATE)
PASS = 58
FAIL = 0

ENGINE            = PASS
APPLICATION STATE = PASS
DISPLAY STATE     = PASS   (corrigé — hasQualifiedScope, moteur inchangé)
UI ACTIONS        = PASS
EXPORT            = PASS
CONFIDENTIALITY   = PASS (unitaire) — auth API vérifiée manuellement, non automatisée
BUILD             = PASS

OPEN P1 = 0

OPEN P2 = 1
  -> Pas de test automatisé pour le 401 sur /api/demandes (GET) et la redirection
     middleware /admin/* sans session — vérifié seulement manuellement (curl).
     Décision THINK : ce P2 ne bloque pas le démarrage du Backoffice ; reclassé
     dans le périmètre BACKOFFICE QA (voir GAP REPORT ci-dessous).

REGRESSIONS = NONE
```

## GATE 1 recommendation : PASS CANDIDATE

ENGINE / APPLICATION STATE / DISPLAY STATE / UI ACTIONS / EXPORT / BUILD sont tous PASS, moteur V6 inchangé (FROZEN respecté). Le seul point ouvert restant (P2 — automatisation des tests d'auth admin) a été explicitement déclassé par THINK comme non bloquant pour Gate 1 et transféré au périmètre Backoffice QA.

Cette décision reste une **candidature** — l'approbation finale de Gate 1 revient à THINK review.

---

# BACKOFFICE — GAP REPORT (PHASE A)

> Note de transparence : à la date de cette revue, le Backoffice n'est **pas** à l'état "à auditer avant tout code" — une première itération (socle DB + auth + Dashboard + Demandes + Détail + Catalogue + Paramètres + Offre publique) a déjà été implémentée dans cette même session, sur validation explicite de l'utilisateur ("tout le socle : DB + auth + Dashboard + Demandes + Détail"). Ce rapport documente donc l'état **réel** du système (Phase A + première itération de Phase B déjà réalisées) plutôt qu'un audit d'un existant préalable, qui n'existait pas (aucun backend, aucune base de données, aucune route admin avant cette session).

## Cartographie réalisée

| Élément | État |
|---|---|
| Routes admin | `/admin/login`, `/admin/dashboard`, `/admin/demandes`, `/admin/demandes/[id]`, `/admin/catalogue`, `/admin/parametres` |
| Routes API | `POST /api/demandes` (public, soumission), `GET /api/demandes` (admin), `GET/PATCH /api/demandes/[id]` (admin), `POST /api/demandes/[id]/publish` (admin), `GET/PUT /api/roi-settings` (admin), `GET/POST /api/auth/[...nextauth]` |
| Auth | NextAuth (Credentials) + middleware protégeant `/admin/*` sauf `/admin/login` |
| Base de données | Prisma + SQLite (dev), modèles `Admin`, `Demande`, `RoiSettings` |
| Admin/public separation | Confirmée — `/admin/*` protégé par middleware, `/offre/[token]` public et sanitizé (BO-09), front client `/` inchangé |
| Dashboard | Métriques réelles (comptage Prisma), pas de KPI fictif ; placeholder explicite "NON IMPLÉMENTÉ" pour le graphique de tendance |
| Demandes workflow | submitted → adjusted (réajustement) → accepted (publication) ; rejected disponible dans le schéma |
| Catalogue | Lecture seule des `PACKS`/`DOMAINS` de `lib/data.ts` — IDs/prix conservés, pas de renommage |
| ROI settings | Persistées via `RoiSettings` (singleton), API confidentielle admin-only |
| Offre publique | Sanitisée (9 champs autorisés uniquement), token-based, aucune donnée ROI ADAI |
| **Conformité "One engine"** | Vérifiée par grep : seul `readjust-panel.tsx` (aperçu live) et `lib/server/demandes.ts` importent `calculate`/`buildPayload` depuis `@/lib/engine` — **aucune réimplémentation de formule de pricing dans `app/`** |

## GAP REPORT — statut final (tous fermés)

| ID | Écart | Sévérité | Statut |
|---|---|---|---|
| GAP-1 | Pas de test automatisé pour l'auth des routes API admin | P2 | ✅ **FERMÉ** — `tests/api-auth.test.ts` (8 tests) : mock `getServerSession`/`prisma`, vérifie 401 sans session sur `GET/PATCH /api/demandes[/id]`, `POST .../publish`, `GET/PUT /api/roi-settings`, et confirme que `POST /api/demandes` (soumission publique) ne renvoie jamais 401. La redirection middleware `/admin/*` reste vérifiée manuellement (curl, 307 confirmé) — composant tiers (`next-auth/middleware`) à faible risque, non ré-implémenté ici. |
| GAP-2 | Catalogue en lecture seule | — | ✅ **Non-gap, décision documentée** — `PACKS`/`DOMAINS` font partie du moteur V6 explicitement gelé par THINK ("PACK RULES = FROZEN"). Les rendre éditables reviendrait à muter des données de pricing gelées sans validation. Le catalogue reste donc **volontairement** en lecture seule. |
| GAP-3 | Pas de captures d'écran | P2 | ✅ **FERMÉ** — 8 captures Playwright/Chromium réelles (login, dashboard, liste, détail, catalogue, paramètres, dashboard tablette 900px, dashboard mobile 390px), stockées dans `doc/screenshots/backoffice/`. Voir section dédiée ci-dessous. |
| GAP-4 | Pack non re-forcé automatiquement dans le réajustement admin | P2 | ✅ **FERMÉ** — `readjust-panel.tsx` : `useEffect` ajouté, miroir exact de la synchronisation du front client (`if (preview.forcedPack !== pack) setPack(preview.forcedPack)`), même règle, même moteur. |
| GAP-5 | Rôles admin multiples non différenciés | — | Non-gap (conforme à la spec V1 : mono-rôle "Admin ADAI") |

**OPEN P2 = 0.**

## Visual QA — captures d'écran réelles (Playwright + Chromium headless)

Le dev server a été piloté par un navigateur Chromium réel (non simulé), avec capture de la console pour détecter toute erreur silencieuse. Deux défauts réels ont été trouvés et corrigés **grâce à cette vérification visuelle** — exactement ce que GAP-3 était censé prévenir :

| Défaut trouvé | Où | Cause | Correction |
|---|---|---|---|
| Warning d'hydratation React (`caret-color: transparent !important` injecté sur le champ recherche entre SSR et hydratation, origine navigateur hors du contrôle du JSX) | `/admin/demandes` | Mutation du DOM par le moteur de rendu Chromium avant l'hydratation React | `suppressHydrationWarning` ajouté sur l'input de recherche (`app/admin/(shell)/demandes/page.tsx`) — pattern officiellement recommandé par React pour ce cas précis |
| Navigation mobile illisible — pastilles vides sans libellé | Sidebar en `<768px` | La règle CSS masquant les libellés à 1024px (mode icône tablette) restait active à 768px, alors que la sidebar mobile est une barre horizontale pleine largeur avec la place d'afficher le texte | Règle ajoutée dans `admin.css` : `.admin-nav a span.label { display: inline }` sous `@media (max-width: 768px)` |

Après correction : **0 erreur console** sur les 8 captures (login, dashboard données réelles, liste, détail 3-colonnes, catalogue, paramètres, dashboard tablette 900px, dashboard mobile 390px). Fichiers dans [doc/screenshots/backoffice/](screenshots/backoffice/).

Points confirmés visuellement :
- Thème Dark Copper Premium conforme (fond `#0c0a09`, accent cuivre `#d08a47`, cards `#1c1917`, radius généreux) sur toutes les pages.
- Détail demande : bloc ROI ADAI visuellement marqué "CONFIDENTIEL · INTERNE ADAI" (bordure pointillée cuivre), réajustement fonctionnel (pack GROW correctement forcé et grisé pour START/SCALE après le fix GAP-4).
- Dashboard : aucun KPI fictif, section "Tendance" explicitement marquée "NON IMPLÉMENTÉ".
- Responsive tablette (900px) : sidebar compacte icônes seules, grille métriques 2 colonnes.
- Responsive mobile (390px) : sidebar en barre horizontale scrollable avec libellés lisibles, layout mono-colonne.

## BACKOFFICE V6 — BUILD REPORT (format section 17 du prompt)

```
AUDIT: PASS (rétrospectif, voir note de transparence ci-dessus)
AUTH: PASS (401 automatisé sur 6 routes API + redirection middleware vérifiée manuellement)
DASHBOARD: PASS (métriques réelles, pas de KPI fictif, vérifié visuellement)
DEMANDES LIST: PASS (recherche, filtre statut, pagination, données réelles, vérifié visuellement)
DEMANDE DETAIL: PASS (3 colonnes : qualification / pricing & ROI ADAI / réajustement, vérifié visuellement)
ROI ADAI CONFIDENTIALITY: PASS (BO-09-a/b/c automatisés + 401 automatisé + badge confidentiel visible)
READJUSTMENT: PASS (repasse par calculate() du moteur V6, pack auto-forcé, aucune logique dupliquée)
CATALOGUE: PASS (lecture seule par design — moteur V6 gelé)
ROI SETTINGS: PASS (persistées via API confidentielle)
PUBLIC OFFER: PASS (sanitisation prouvée par tests automatisés)
RESPONSIVE: PASS (vérifié visuellement à 1440/900/390px, 2 défauts trouvés et corrigés)
A11Y: PARTIEL — aria-current/aria-pressed/labels/focus-visible en place, pas d'audit exhaustif (ex. lecteur d'écran)
BUILD: PASS
TESTS: 66/66 PASS (dont 8 auth, 3 confidentialité ROI ADAI, 3 EMPTY DISPLAY STATE)
OPEN P1: 0
OPEN P2: 0
REGRESSIONS: NONE
```

Restant hors périmètre de cette session (non bloquant, à considérer pour une itération future) :
- Audit A11y exhaustif (lecteur d'écran, navigation clavier complète sur le réajustement/domaines).
- Édition du catalogue si le produit décide un jour de dégeler cette partie du moteur (nécessiterait une validation THINK explicite).

STOP — en attente de THINK REVIEW pour validation finale Gate 1 + Backoffice.
