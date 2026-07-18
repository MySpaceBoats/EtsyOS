# Changelog — EtsyOS

## [Unreleased]

### Added

- **Workflow Engine** (`Core/engine`) — le moteur unique d'orchestration de la pipeline produit :
  - Product Object : structure unique circulant dans toute la pipeline, une section par étape, source
    (`offline-heuristic`/`mcp-*`/`human`) tracée sur chaque section
  - State Manager : persistance JSON resumable sous `Core/state/` (products, workflows, index), écriture
    atomique (write-then-rename)
  - Event Bus : abonnés in-process + journal NDJSON, base du Dashboard temps réel du Control Center
  - Task Queue : file FIFO fichier avec tentatives/échec/mort, seul point d'entrée pour lancer/reprendre/
    relancer un workflow
  - Pipeline à 11 étapes (trend-discovery → market-analysis → opportunity-scoring → product-planner →
    product-generator → image-generator → mockup-generator → seo-generator → quality-assurance → validation
    → publishing), providers heuristiques offline déterministes en attendant les MCP `market`/`seo`/
    `image-generation`/`quality`
  - Mode dry-run traversant l'intégralité de la pipeline sans jamais rien envoyer à Etsy/Printify
  - Deux gates non contournables : `validation` (lit le statut humain écrit par le Control Center) et
    `publishing` (re-vérifie QA + validation avant tout envoi, refuse explicitement le mode live tant que le
    gate d'écriture MCP Phase 4 n'existe pas)
  - CLI (`npm run pipeline -- run|run-all|resume|retry|worker|status`), 20 tests unitaires + intégration
  - `Core/state` seedé par une exécution dry-run réelle sur les 6 fiches existantes (base du mode
    `MOCK_DATA=1` du Control Center)
- **EtsyOS Control Center** — `Web` devient l'interface graphique officielle d'EtsyOS, observant l'intégralité
  du Workflow Engine :
  - Navigation latérale permanente + palette de commande `⌘K`
  - Dashboard temps réel (KPIs, workflows actifs, activité, produits par étape de pipeline)
  - Une page par étape (`/trends`, `/market`, `/scoring`, `/planner`, `/generator`, `/images`, `/mockups`,
    `/seo`, `/qa`), plus `/workflows` (+ Workflow Visualizer par workflow), `/queue`, `/logs`, `/publishing`,
    `/analytics`, `/learning`, `/assets`, `/mcp`, `/config`
  - `/validation` — la console existante, désormais documentée et intégrée comme l'étape `validation` du
    moteur (workflows en pause listés en tête de page)
  - Product Inspector (`/products/[slug]`) — Product Object complet, workflows associés, historique, en plus
    de la fiche/aperçu Etsy existants
  - Actualisation automatique (polling `router.refresh()` toutes les 30s), mode sombre/clair inchangés
  - Lecture de `Core/state/**` via la même GitHub Contents API que les fiches (`lib/state.ts`), snapshot mock
    régénérable (`scripts/build-mock-state.mjs`) construit à partir d'une vraie exécution du moteur
- `.github/workflows/deploy.yml` — déploiement automatique du Control Center sur Cloudflare Pages à chaque
  push sur `main` : Tests → Build (adaptateur next-on-pages) → Déploiement (`cloudflare/wrangler-action`) →
  invalidation du cache en périphérie → mise en ligne
- `.github/workflows/tests.yml` — job `engine` ajouté (typecheck + tests de `Core/engine`)

- Phase 1 auth: `MCP/etsy` — OAuth2 PKCE wrapper (`npm run authorize`, automatic token refresh) in front of
  the vendored `etsy-mcp-2026-complete` server (git submodule, 50+ tools, MIT)
- Phase 1 auth: `MCP/printify` — thin wrapper around the published `@tsavo/printify-mcp` npm package (ISC)
- `MCP/higgsfield` documented as a hosted remote MCP (`mcp.higgsfield.ai/mcp`), no local code
- Root `.mcp.json` registering all three servers for Claude Code
- `THIRD_PARTY_NOTICES.md` tracking vendored/dependency provenance and licenses
- Both Etsy and Printify wrappers smoke-tested end-to-end against a real MCP `initialize` handshake

### Changed

- Etsy/Printify MCP servers pivoted from custom-built (2 read-only tools each, Phase 0 plan) to vendored
  existing servers (full CRUD, 50+ and ~15 tools respectively) — see ROADMAP.md Phase 1 and each server's
  README "⚠️ Not read-only" section for the resulting scope caveat

## [0.1.0] - 2026-07-17

### Added

- Fondation initiale du depot : architecture complete, structure Obsidian (25 dossiers), structure logicielle
  (16 dossiers racine), 13 agents, 15 serveurs MCP, 15 routines, 12 workflows GitHub Actions (squelettes),
  documentation complete a la racine.
