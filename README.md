# ADAI Cockpit Builder — V6

Configurateur commercial ADAI : qualification client, sélection de packs/modules, pricing, ROI ADAI (interne) et ROI client, avec un backoffice admin pour piloter les demandes et publier des offres clients.

## Stack technique

| Domaine | Techno |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styles | Tailwind CSS + CSS custom (thème "Dark Copper Premium" pour l'admin) |
| Base de données | **SQLite** (fichier local `prisma/dev.db`), via **Prisma ORM 6** |
| Authentification | NextAuth.js (Credentials provider) |
| Tests | Vitest + Testing Library |

### Base de données

Le projet utilise **SQLite** en développement, géré par **Prisma** (`prisma/schema.prisma`). Trois modèles :

- `Admin` — comptes administrateurs du backoffice (email + mot de passe hashé)
- `Demande` — les demandes clients soumises depuis le Cockpit Builder (profil client, besoin, pricing, ROI ADAI, ROI client — stockés en JSON sérialisé), avec un statut (`submitted` → `adjusted` → `accepted`/`rejected`) et un token public pour l'offre publiée
- `RoiSettings` — paramètres ROI ADAI internes (confidentiels), ligne singleton

Le schéma n'utilise pas le type `Json` natif de Prisma (non portable entre moteurs) mais des champs `String` avec sérialisation JSON manuelle, ce qui permet de **basculer vers PostgreSQL ou MySQL en production** sans changer le schéma — il suffit de modifier `provider` et `DATABASE_URL` dans `.env`.

## Démarrage

```bash
pnpm install
pnpm db:migrate    # crée prisma/dev.db et applique le schéma
pnpm db:seed       # crée l'admin par défaut + les paramètres ROI par défaut
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) pour le front client, [http://localhost:3000/admin/login](http://localhost:3000/admin/login) pour le backoffice.

Identifiants admin par défaut (définis dans `.env`, à changer en production) :
- Email : `admin@adai.local`
- Mot de passe : `ChangeMe123!`

## Scripts

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm start` | Démarrage en production |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests (Vitest) |
| `pnpm test:watch` | Tests en mode watch |
| `pnpm db:migrate` | Applique les migrations Prisma |
| `pnpm db:seed` | Seed admin + paramètres ROI |
| `pnpm db:studio` | Ouvre Prisma Studio (explorateur de la base) |

## Structure

```
app/
  page.tsx                # Front client — Cockpit Builder ("/")
  admin/                   # Backoffice admin (protégé par middleware)
    login/                 # Connexion admin
    (shell)/dashboard/     # Dashboard (métriques réelles)
    (shell)/demandes/      # Liste + détail + réajustement des demandes
    (shell)/catalogue/     # Packs & modules (lecture seule)
    (shell)/parametres/    # Paramètres ROI ADAI (confidentiel)
  offre/[token]/           # Offre publique tokenisée (aucune donnée ROI interne)
  api/                     # Routes API (demandes, auth, roi-settings)
components/
  cockpit-builder.tsx      # Composant principal du front client
lib/
  data.ts                  # Référentiel : packs, domaines, modules, presets
  engine.ts                # Moteur de calcul (pricing, ROI ADAI, ROI client) — source unique de vérité
  types.ts                 # Types partagés
  server/                  # Logique serveur (demandes, sanitisation offre publique)
prisma/
  schema.prisma            # Schéma de base de données
  seed.ts                  # Script de seed
tests/                     # Tests Vitest (moteur, UI, auth API, offre publique)
doc/                       # Documentation, rapports QA, captures d'écran
```

Le moteur de calcul (`lib/engine.ts`) est la seule source de vérité pour le pricing : le front client, le backoffice et l'offre publique le consomment tous, sans dupliquer de logique métier.
