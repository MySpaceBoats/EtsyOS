# Roadmap — EtsyOS

## Phase 0 — Fondation

- [x] Architecture complete et coherente
- [x] Tous les dossiers (software + Obsidian)
- [x] Tous les README
- [x] Templates de base
- [x] Documentation racine
- [x] GitHub Actions (squelettes documentes)
- [x] Structure des agents (13)
- [x] Structure des MCP (15)
- [x] Structure des routines (15)
- [x] Structure Obsidian (25 dossiers)
- [x] Conventions du projet

## Phase 1 — Authentification & infrastructure (priorite 1)

- [x] MCP `etsy` — auth OAuth2 PKCE (wrapper maison) + serveur vendored `etsy-mcp-2026-complete` (50+ outils,
      voir THIRD_PARTY_NOTICES.md) — smoke-teste bout-en-bout
- [x] MCP `printify` — auth token personnel + dependance npm `@tsavo/printify-mcp` — smoke-teste bout-en-bout
- [ ] **Gate d'ecriture** — les deux MCP exposent du CRUD complet, pas juste de la lecture comme prevu
      initialement. Rien n'empeche aujourd'hui la creation/suppression d'un listing/produit avant Phase 4
      (`Quality-Agent`). Discipline de prompt uniquement pour l'instant — voir README.md de chaque MCP. C'est
      aussi ce qui bloque l'etape `publishing` du Workflow Engine en mode live (elle refuse explicitement).
- [ ] Secrets GitHub Actions (Etsy API, Printify API, Higgsfield, R2) — a configurer par Reda, voir INSTALL.md
- [ ] Persistance du `refresh_token` Etsy sur runner ephemere (voir MCP/etsy/README.md "Limitation connue")
- [x] MCP `storage` — client R2 fonctionnel (upload/download/delete/list/getSignedUrl/publicUrl, teste hors ligne)
- [x] MCP `image-generation` — generation multi-fournisseurs avec bascule automatique (Workers AI → Imagen →
      HuggingFace), avancee depuis Phase 3 a la demande explicite de Reda (l'item Higgsfield reste en Phase 3)
- [x] **Workflow Engine** (`Core/engine`) — Product Object, State Manager, Event Bus, Task Queue, pipeline a
      11 etapes (trend-discovery → market-analysis → opportunity-scoring → product-planner →
      product-generator → image-generator → mockup-generator → seo-generator → quality-assurance →
      validation → publishing), mode dry-run, gate humain + gate QA non contournables, CLI, 20 tests.
      Providers heuristiques offline aujourd'hui pour trend/market/scoring/planner/generation/seo — remplaces
      un a un par les MCP `market`/`seo`/`image-generation`/`quality` au fil des phases suivantes. Voir
      Core/engine/README.md.
- [x] `Web` → **EtsyOS Control Center** — devenu l'interface graphique officielle d'EtsyOS (Next.js 15 /
      Cloudflare Pages) : observabilite complete du Workflow Engine (Dashboard, Workflows, une page par etape
      de pipeline, Assets, MCP, Logs, Configuration) + page `/validation` (ex-console), integree comme
      l'etape `validation` du moteur. Le seul chemin d'ecriture reste une demande d'etat (frontmatter de
      fiche, ou intention dans la Task Queue) via la GitHub Contents API — n'appelle jamais Etsy/Printify/MCP
      directement, ne depense jamais d'argent depuis un clic. Deploiement automatique cable
      (`.github/workflows/deploy.yml`, Tests → Build → Deploiement Cloudflare Pages) — creation du projet
      Pages et des secrets reste manuelle une fois (Reda). Voir Web/README.md.
- [ ] Routine `Health-Check` fonctionnelle
- [ ] Cabler une premiere routine GitHub Actions pour vider la Task Queue (`npm run pipeline -- worker`) sur
      un cron, plutot que d'executer le moteur uniquement depuis Claude Code en local

## Phase 2 — Marche & connaissance (priorite 2)

- [ ] MCP `market`, `competitor`
- [ ] Agent `Market-Agent`, `Trend-Agent` — a invoquer **depuis les etapes** `trend-discovery`/`market-analysis`
      du Workflow Engine (remplacement du provider `offline-heuristic` par `mcp-etsy`/`mcp-*`), jamais comme
      processus independant
- [ ] Routine `Market-Scan`, `Competitor-Scan`, `Trend-Discovery` — declenchent le moteur via la Task Queue
- [ ] MCP `knowledge` + premiere structure de memoire persistante

## Phase 3 — Creation produit (priorite 3)

- [ ] MCP `higgsfield` — resoudre l'auth headless (hosted remote MCP, auth navigateur par defaut — voir
      MCP/higgsfield/README.md) avant de l'utiliser depuis une routine GitHub Actions
- [ ] MCP `seo`, `assets` — brancher comme provider des etapes `seo-generator`/`image-generator`/
      `mockup-generator` (aujourd'hui `offline-heuristic`/planifie-simule)
- [ ] Agent `SEO-Agent`, `Design-Agent` — invoques depuis les etapes correspondantes du moteur
- [ ] Routine `Product-Generation`, `SEO-Optimization`, `Mockup-Generation` — declenchent le moteur via la
      Task Queue

## Phase 4 — Publication (priorite 4)

- [ ] MCP `publishing`, `quality` — brancher comme provider de l'etape `quality-assurance` (aujourd'hui
      heuristique) et lever le refus explicite de l'etape `publishing` en mode live (le gate d'ecriture ci-
      dessus est le prerequis exact)
- [ ] Agent `Publishing-Agent`, `Quality-Agent`
- [ ] Routine `Publishing`, `Printify-Sync` — invoquent l'etape `publishing` du moteur, jamais Etsy/Printify
      directement

## Phase 5 — Performance & apprentissage (priorite 5)

- [ ] MCP `analytics`, `pricing`, `experiments`
- [ ] Agent `Analytics-Agent`, `Pricing-Agent`, `Experiment-Agent`, `Learning-Agent` — alimentent les pages
      Analytics/Learning du Control Center avec des donnees reelles (aujourd'hui : metriques de production du
      moteur uniquement, ventes explicitement marquees "en attente du provider live")
- [ ] Routine `Analytics`, `Optimization`, `Weekly-Review`, `Learning`

## Phase 6 — Maintenance

- [ ] Routine `Backup`, `Cleanup`
- [ ] MCP `notifications`
- [ ] Agent `Planning-Agent`, `Asset-Manager-Agent`

## Priorites immediates (prochaine session)

1. Reda : le projet Cloudflare Pages `etsyos-validation` existe deja (deploiement manuel initial fait) ; configurer `CLOUDFLARE_API_TOKEN` /
   `CLOUDFLARE_ACCOUNT_ID` comme secrets GitHub Actions, et `GITHUB_TOKEN`/`GITHUB_REPO`/`GITHUB_BRANCH` comme
   env vars Pages — voir Web/README.md "Déploiement"
2. Reda : configurer Cloudflare Access devant le Control Center (allowlist d'emails)
3. Reda : creer l'app Etsy (developer.etsy.com), le token Printify, et configurer les secrets GitHub Actions
4. Reda : `git submodule update --init MCP/etsy/vendor/etsy-mcp-2026-complete`, puis `cd MCP/etsy && npm run authorize` une fois `ETSY_CLIENT_ID` renseigne, reporter `ETSY_SHOP_ID`
5. Definir le gate d'ecriture (allowlist d'outils MCP en lecture seule tant que `Quality-Agent` n'existe pas) —
   c'est le prerequis exact que l'etape `publishing` du moteur attend pour sortir du dry-run
6. Resoudre la persistance du refresh token Etsy pour les runners GitHub Actions (ephemeres)
7. Cabler une routine GitHub Actions qui vide la Task Queue sur un cron (`npm run pipeline -- worker`)
8. Premiere iteration de `Market-Agent` + MCP `market` (donnees reelles, pas de mock) branchee comme provider
   des etapes `trend-discovery`/`market-analysis` (remplace `offline-heuristic` par `mcp-etsy`)
