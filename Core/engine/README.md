# Core/engine — Workflow Engine

Le moteur unique d'EtsyOS. Toute fonctionnalite (Trend Discovery, Market Analysis, Opportunity Scoring,
Product Planner, Product/Image/Mockup/SEO Generator, Quality Assurance, Validation, Publishing) est une
**etape enregistree** de ce moteur — jamais un agent isole, jamais un service parallele. Voir
`ARCHITECTURE.md` a la racine pour la vue d'ensemble.

## Abstractions

| Fichier | Rôle |
|---|---|
| `src/product-object.ts` | Le **Product Object** : structure unique qui circule dans toute la pipeline. Chaque étape lit les sections précédentes et écrit exactement la sienne. |
| `src/state.ts` | **State Manager** : persistance JSON resumable sous `Core/state/` (products, workflows, index agrégé). Écriture atomique. |
| `src/events.ts` | **Event Bus** : abonnés in-process + journal NDJSON (`Core/state/events/`) pour que le Control Center rejoue l'activité sans connexion directe au moteur. |
| `src/queue.ts` | **Task Queue** : file FIFO fichier (`Core/state/queue/tasks.json`), tentatives/échec/mort. Seul point d'entrée pour lancer/reprendre/relancer un workflow. |
| `src/engine.ts` | Le moteur : exécute le pipeline étape par étape, persiste avant/après chaque étape, gère pause (gate humain) et échec, reprend exactement où il s'est arrêté. |
| `src/pipeline.ts` | Câblage : la liste ordonnée des 11 étapes de production + `createEngine()`. |
| `src/steps/*.ts` | Implémentation de chaque étape (providers heuristiques offline aujourd'hui, remplacés un à un par des providers MCP live). |
| `src/listing-bridge.ts` | Pont vers les fiches `Products/<Categorie>/Listings/<slug>.md` : lit le statut humain, écrit la fiche Draft initiale pour un produit né dans la pipeline. |
| `src/cli.ts` | Point d'entrée (`npm run pipeline`) utilisé par Claude Code et les routines GitHub Actions. |

## Le pipeline de production

```
trend-discovery → market-analysis → opportunity-scoring → product-planner
  → product-generator → image-generator → mockup-generator → seo-generator
  → quality-assurance → validation (gate humain) → publishing (gate final)
```

Chaque étape écrit exactement une section du Product Object (`trend`, `market`, `opportunity`, `plan`,
`generation`, `images`, `mockups`, `seo`, `qa`, `validation`, `publication`). Chaque section porte sa source
(`offline-heuristic` | `mcp-*` | `human`) — rien ne peut se faire passer pour une donnée de marché réelle.

## Providers : offline aujourd'hui, MCP demain

`trend-discovery`, `market-analysis`, `opportunity-scoring`, `product-planner`, `product-generator`,
`seo-generator` utilisent des heuristiques déterministes (`src/steps/catalog.ts`, `src/util.ts`) — mêmes
entrées, mêmes sorties, aucun appel réseau, aucune dépense. Cela permet à toute la pipeline de tourner de
bout en bout dès aujourd'hui. `image-generator`/`mockup-generator` **planifient** des clés R2 et les marquent
`simulated: true` tant que le MCP `image-generation` n'est pas invoqué depuis une étape en mode live.

Remplacer un provider heuristique par un provider MCP ne change ni la forme du Product Object, ni le
comportement du moteur, ni les pages du Control Center qui l'affichent — seul `meta.source` change de
`offline-heuristic` à `mcp-*`.

## Les deux gates — jamais contournables

- **`validation`** : lit le `status` de la fiche écrite par le Control Center (page `/validation`). Statut
  absent ou `Draft`/`OnHold` → le workflow **pause**. `Approved`/`PublishRequested`/`Published` → continue,
  approuvé. `Rejected`/`Archived` → continue, non approuvé. L'étape n'écrit jamais la décision elle-même.
- **`publishing`** : re-vérifie `qa.passed` ET `validation.approved` avant tout envoi, indépendamment de ce
  que rapportent les étapes précédentes. En dry-run, simule sans jamais appeler Etsy/Printify. En mode live,
  refuse tant que le gate d'écriture MCP (ROADMAP Phase 4, `Quality-Agent`) n'existe pas — jamais de
  publication silencieuse par défaut.

## Mode Dry Run

Chaque workflow porte `dryRun: boolean`. C'est le mode par défaut de toute exécution manuelle
(`npm run pipeline -- run --dry-run`). Un dry-run traverse l'intégralité des 11 étapes, y compris
`publishing`, mais rien ne quitte jamais la machine — c'est la garantie testée dans
`tests/steps.test.ts` et `tests/engine.test.ts`.

## CLI

```bash
npm install
npm run typecheck
npm test

# Lancer une pipeline pour une fiche existante
npm run pipeline -- run --slug sage-ceramic-mug --dry-run

# Lancer la pipeline pour toutes les fiches sous Products/*/Listings
npm run pipeline -- run-all --dry-run

# Reprendre un workflow en pause (après une décision humaine dans le Control Center)
npm run pipeline -- resume --workflow wf_sage-ceramic-mug_1

# Relancer depuis l'étape en échec
npm run pipeline -- retry --workflow wf_sage-ceramic-mug_1

# Vider la file d'attente (ce que fait une routine GitHub Actions)
npm run pipeline -- worker

# État agrégé (ce que lit le Dashboard)
npm run pipeline -- status
```

Toute exécution passe par la Task Queue (`Core/state/queue/tasks.json`) — c'est le même chemin qu'utilise le
Control Center quand un humain clique "Reprendre"/"Relancer" (la page web écrit l'intention, le moteur
l'exécute).

## État (`Core/state/`)

```
Core/state/
  products/<productId>.json     Product Objects
  workflows/<workflowId>.json   Exécutions de workflow (étapes, logs, durées)
  events/<YYYY-MM-DD>.ndjson    Journal d'événements (Event Bus)
  queue/tasks.json              Task Queue
  index.json                    Agrégat bon marché pour le Dashboard
```

Committé au dépôt intentionnellement : c'est ce qui rend un workflow **reprenable après interruption** (le
State Manager écrit de façon atomique) et **observable sans connexion au moteur** (le Control Center le lit
via la GitHub Contents API, exactement comme il lit les fiches produit).

## Tests

`tests/core.test.ts` (Product Object, Event Bus, State Manager, Task Queue), `tests/steps.test.ts` (chaque
étape individuellement, dont la détection QA de marques protégées et de doublons), `tests/engine.test.ts`
(intégration : pause/reprise au gate humain, échec + retry, garantie dry-run, écriture de la fiche Draft pour
un produit né dans la pipeline).

```bash
npm test
```

## Statut

Opérationnel — 11 étapes, dry-run, gate humain, 20 tests. Providers heuristiques en attente de remplacement
par les MCP `market`/`seo`/`image-generation`/`quality` au fil des phases de la ROADMAP.
