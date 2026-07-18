# Web — EtsyOS Control Center

L'interface graphique officielle d'EtsyOS (Next.js 15, App Router). Elle affiche
l'intégralité du fonctionnement interne du **Workflow Engine** (`Core/engine`) :
chaque étape de la pipeline, chaque Product Object, chaque workflow, chaque
événement, chaque asset planifié — et reste le point de contrôle humain où un
produit est validé avant d'approcher Etsy. Rien ne se publie sans qu'une
personne clique un vrai bouton **et** que la Quality Assurance ait passé.

Déployée sur **Cloudflare Pages** (runtime Workers), déploiement automatique via
`.github/workflows/deploy.yml` sur chaque push vers `main`. Sœur de `Products/`,
`MCP/`, `Agents/`, `Core/` — pas un dossier Obsidian numéroté.

## Deux sources de données, une seule règle : lecture seule sur le moteur

- **`lib/data.ts` / `lib/listings.ts`** — les fiches produit (`Products/*/Listings/*.md`),
  inchangé depuis la console de validation d'origine.
- **`lib/state.ts` / `lib/engine-types.ts`** — l'état du Workflow Engine
  (`Core/state/**` : Product Objects, workflows, événements, file d'attente),
  lu à travers la même GitHub Contents API, avec le même cache de lecture ~30s.

Le Control Center ne réimplémente jamais la logique du moteur — il l'observe.
Le seul chemin d'écriture vers `Core/state` est l'ajout d'une **intention** dans
la Task Queue (`enqueueTask` dans `lib/state.ts`, utilisé par le bouton
"Reprendre"/"Relancer" des pages Workflows) : exactement la même frontière de
sécurité que l'écriture de frontmatter ci-dessous — la console écrit une
demande, le moteur (Claude Code / une routine GitHub Actions) l'exécute.

---

## ⚠️ Frontière de sécurité — la partie critique

La console **ne fait qu'une seule chose** pour toute action : elle **demande** un
changement d'état en écrivant du frontmatter dans une fiche produit sur GitHub
(via la GitHub Contents API). Elle **n'appelle jamais** l'API Etsy, l'API
Printify, ni aucun serveur MCP, et **ne dépense jamais d'argent** (aucune
génération d'image) depuis un clic de bouton.

Contexte : la ROADMAP d'EtsyOS documente un risque connu et non résolu — `MCP/etsy`
et `MCP/printify` exposent du CRUD complet sans gate d'écriture (Phase 4
`Quality-Agent` pas encore construite). Tant que ce gate n'existe pas, le tier web
public ne doit **jamais** pouvoir déclencher une écriture externe.

Chaque bouton fait la même chose sous le capot : lire la fiche → muter des champs
de frontmatter précis + ajouter une entrée à `history` → committer via la GitHub
API. C'est tout.

| Bouton | Effet frontmatter | Appel externe |
|---|---|---|
| ✅ Valider | `status: Approved` | **aucun** (décision explicite, pas un oubli) |
| 📤 Publier maintenant (activé seulement si `Approved`) | `status: PublishRequested` | **aucun** — stage juste « plus fort » |
| ❌ Refuser | `status: Rejected` (fiche jamais supprimée, history conservée) | aucun |
| 📌 Mettre en attente | `status: OnHold` | aucun |
| 📂 Archiver | `status: Archived` | aucun |
| ⭐ Favori | bascule `favorite` | aucun |
| ✏ Modifier | PUT de la fiche (title/desc/tags/price/variants/colors/categories/materials), `updated` bump + history | aucun |
| 🔄 Régénérer (images/mockups/vidéo/titre/description/tags/tout) | `regeneration_requested: "<type>"` + history | **aucun** — stub |

Une **future Routine** (cron GitHub Actions, hors de cette tâche) scrutera
`status: PublishRequested` et `regeneration_requested: <type>`, et effectuera les
vrais appels Printify/Etsy/génération via les serveurs MCP existants, **à
l'intérieur de l'environnement contrôlé de Claude Code — jamais depuis le tier web
public.**

---

## GitHub comme base de données

Il n'y a **aucun accès filesystem au repo à l'exécution en production** (le bundle
Pages déployé n'a pas `Products/` à côté de lui). Donc :

- **Toutes** les lectures/écritures passent par la GitHub REST Contents API
  (`GET/PUT …/contents/Products/<Category>/Listings/<slug>.md`), via `fetch`
  brut (`lib/github.ts`, ~110 lignes, pas d'`@octokit`). Même chemin de code en
  `next dev` (Node) et sur Pages (Workers) — aucun branchement d'environnement.
- Lectures cachées ~30 s (`next: { revalidate: 30 }`) pour ménager la limite de
  5000 req/h de l'API GitHub. Après une écriture, `revalidatePath()` invalide.
- Une écriture (PUT) nécessite le SHA du blob git courant : la console fait
  fetch-puis-write (pas de résolution de conflit — outil mono-utilisateur).

### Mode mock (dev / CI uniquement)

Si `MOCK_DATA=1`, l'app sert les 6 fiches de seed depuis `lib/mock.ts` **et**
l'état du Workflow Engine depuis `lib/mock-state.json` — un snapshot **réel**
d'une exécution dry-run du moteur (`Core/state/**`), pas des données
inventées. Le snapshot est régénéré avec :

```bash
cd Web && node scripts/build-mock-state.mjs
```

à relancer après tout `npm run pipeline -- run-all --dry-run` dans
`Core/engine` dont on veut refléter le nouvel état en mode mock/CI. En mock,
les écritures (fiches, file d'attente) ne sont pas persistées (réponse
optimiste). **Ne jamais activer `MOCK_DATA` en prod.** Le chemin de production
(GitHub API) et le chemin mock partagent exactement le même code d'affichage ;
seule la source des données diffère.

---

## Modèle de données

Une fiche par produit : `Products/<Category>/Listings/<slug>.md`. Le dossier
`Listings/` n'est ajouté que dans les catégories avec seed (Mugs, Shirts,
Wall-Art). Frontmatter YAML — voir `lib/listings.ts` pour le type complet
(`type: product-listing`, `layer: products`, `status`, `slug`, `title_etsy`,
`tags` (≤13), `price`, `variants`, `images` (1re = principale), `history[]`, etc.).

Statuts : `Draft · Approved · PublishRequested · Published · Rejected · OnHold ·
Archived`. `history` conserve chaque transition pour toujours.

---

## Pages

Navigation latérale permanente (`components/control/sidebar.tsx`) + palette de
commande `⌘K`/`Ctrl+K` (`components/control/command-palette.tsx`) donnant accès
à toutes les pages et à tous les produits.

- **`/`** — Dashboard : KPIs (workflows actifs, en attente de validation,
  produits, rejets, erreurs, taille de file, durée moyenne pipeline), workflows
  en cours, répartition des produits par étape de pipeline, activité récente.
- **`/workflows`**, **`/workflows/[id]`** — Toutes les exécutions du moteur ;
  détail = Workflow Visualizer (`components/control/workflow-graph.tsx`) avec
  état/durée/logs par étape, bouton Reprendre/Relancer.
- **`/queue`** — Task Queue du moteur (tentatives, échecs, tâches mortes).
- **`/trends`**, **`/market`**, **`/scoring`**, **`/planner`**,
  **`/generator`**, **`/images`**, **`/mockups`**, **`/seo`**, **`/qa`** — une
  page par étape de pipeline (`components/control/section-page.tsx`), un
  produit par carte, données réelles issues du Product Object correspondant.
- **`/validation`** — la console de validation d'origine, inchangée dans son
  fonctionnement (grille de cartes, recherche, filtres, actions), maintenant
  documentée comme l'étape `validation` du moteur : les workflows en pause sur
  ce gate sont listés en tête de page.
- **`/products/[slug]`** — **Product Inspector** : la fiche (Validation, Aperçu
  Etsy — inchangés) + le Product Object complet section par section, les
  workflows associés (mini Workflow Visualizer), l'historique, un inspecteur
  JSON brut.
- **`/publishing`** — état de publication par produit (bloqué / simulé / publié
  + raison de blocage).
- **`/analytics`** — métriques de production réelles du moteur (débit,
  durées moyennes par étape, taux de passage QA/validation) ; les métriques de
  vente Etsy (revenus, CTR…) restent en attente du provider MCP `etsy` (Phase 5)
  et ne sont jamais simulées.
- **`/learning`** — signaux extraits de l'état réel (score vs décision humaine,
  échecs QA récurrents, régénérations) en attendant le `Learning-Agent`.
- **`/assets`** — manifeste des assets R2 dérivé des Product Objects.
- **`/mcp`** — registre des serveurs MCP du dépôt et leur statut ROADMAP.
- **`/logs`** — journal complet de l'Event Bus + logs par étape de chaque
  workflow.
- **`/config`** — variables attendues côté Pages/Actions et leur présence
  (jamais leur valeur).

---

## Auth — aucune dans le code

La protection est **Cloudflare Access (Zero Trust)** devant le projet Pages :
allowlist d'emails configurée dans le dashboard, zéro code applicatif, extensible
en ajoutant des emails à la policy. Pas de login/session/NextAuth dans l'app.
**Access doit être configuré après le déploiement** (étape manuelle dashboard).

---

## Développement local

```bash
cd Web
npm install                 # .npmrc force legacy-peer-deps (conflit next-on-pages/wrangler)
cp .env.example .env.local  # laisser GITHUB_TOKEN vide et MOCK_DATA=1 pour un dev sans token
MOCK_DATA=1 npm run dev     # http://localhost:3000 avec les fiches de seed
```

Avec un vrai token : renseigner `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`
dans `.env.local`, laisser `MOCK_DATA=0`.

### Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de dev |
| `npm run build` | build Next.js standard |
| `npm run pages:build` | build adaptateur Cloudflare (`@cloudflare/next-on-pages`) — **le build qui compte** |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Variables d'environnement (requises)

| Variable | Exemple | Rôle |
|---|---|---|
| `GITHUB_TOKEN` | *(PAT fine-grained)* | PAT GitHub fine-grained, scope **Contents: Read and write** sur le repo EtsyOS. **Pas encore créé.** À définir comme secret Cloudflare Pages (et secret *Preview*). Jamais commité. |
| `GITHUB_REPO` | `MySpaceBoats/EtsyOS` | repo qui stocke les fiches |
| `GITHUB_BRANCH` | `main` | branche lue/écrite |
| `MOCK_DATA` | `0` | `1` = mode mock (dev/CI uniquement), jamais en prod |

---

## Déploiement — Cloudflare Pages (automatique)

`.github/workflows/deploy.yml` déploie automatiquement à chaque push sur `main` :
Tests (typecheck + lint + build) → Build adaptateur Cloudflare
(`npx @cloudflare/next-on-pages` → `.vercel/output/static`) → Déploiement
(`cloudflare/wrangler-action` → `wrangler pages deploy`) → invalidation du cache
en périphérie (automatique côté Cloudflare Pages à chaque déploiement) → mise en
ligne (alias de production mis à jour de façon atomique par `wrangler`). Le job
`web` de `.github/workflows/tests.yml` couvre déjà typecheck/lint/build sur
chaque PR ; `deploy.yml` re-vérifie avant de déployer car un merge peut combiner
des changements individuellement verts en un état rouge.

**Secrets requis (GitHub Actions, repo secrets) :**

| Secret | Rôle |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token avec permission "Cloudflare Pages: Edit" sur le compte |
| `CLOUDFLARE_ACCOUNT_ID` | ID du compte Cloudflare hébergeant le projet Pages |

Toutes les Route Handlers / pages dynamiques déclarent `export const runtime =
"edge"` (requis par next-on-pages). Images non optimisées (`images.unoptimized`)
— servies directement par le CDN Cloudflare/R2.

**Réglages du projet Pages (créé une fois, manuellement, par Reda) :**

| Réglage | Valeur |
|---|---|
| Nom du projet | `etsyos-validation` (doit correspondre à `--project-name` dans `deploy.yml`) |
| Compatibility flags | `nodejs_compat` |
| Env vars (Production + Preview) | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` |

Étapes **manuelles une seule fois** (non scriptées, réalisées par Reda) : création
du projet Pages, création de `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` comme
secrets GitHub Actions, configuration de Cloudflare Access, création du
`GITHUB_TOKEN`. Voir DEPLOYMENT.md pour le détail.
