---
type: mcp-server
layer: mcp
created: 2026-07-17
updated: 2026-07-17
status: implemente
---

# MCP — image-generation

## Role

Generation d'images multi-fournisseurs avec bascule automatique. Un seul outil expose, `generate_image` ;
en interne le serveur essaie les fournisseurs dans l'ordre de priorite configure et retourne un resultat
unifie. L'appelant ne sait pas quel fournisseur a servi la requete sauf en inspectant `metadata`.

## Fournisseurs

| Nom | API | Env |
|---|---|---|
| `workers-ai` | Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`) | `CF_ACCOUNT_ID`, `CF_API_TOKEN` |
| `imagen` | Google AI Studio Imagen (`imagen-3.0-generate-001`) | `GOOGLE_AI_STUDIO_API_KEY` |
| `huggingface` | HuggingFace Inference API (modele swappable via config) | `HUGGINGFACE_API_KEY` |

Ordre de priorite par defaut : `workers-ai -> imagen -> huggingface` (voir `config.example.json`).

## Architecture

Chaque module est testable independamment :

- `src/types.ts` — `ProviderRequest`, `ProviderResult`, `ProviderError` (avec `retryable` + `reason`)
- `src/providers/provider.interface.ts` — interface commune `ImageProvider`
- `src/providers/*.provider.ts` — un fournisseur par fichier
- `src/provider-manager.ts` — parcourt l'ordre de priorite, bascule au suivant a chaque echec, ne leve
  `AllProvidersFailedError` que si tous echouent (agregat de toutes les raisons)
- `src/retry-manager.ts` — backoff exponentiel borne (`baseDelayMs`/`maxDelayMs`/`maxAttempts`), ne retente
  que les erreurs `retryable`
- `src/health-monitor.ts` — cache memoire de l'etat de sante par fournisseur ; `quota`/`rate_limit`
  desactivent temporairement un fournisseur (cooldown), que le manager saute sans meme l'appeler
- `src/metrics-collector.ts` — compteurs par fournisseur (generations, echecs, temps, cout estime)
- `src/logger.ts` — log structure pas-a-pas (JSON lines). Ecrit sur **stderr** (stdout est reserve au
  flux MCP stdio)
- `src/index.ts` / `src/run.ts` — point d'entree serveur MCP

## Configuration

Fichier JSON (`config.json` si present, sinon `config.example.json`) : ordre de priorite, modele/params
par fournisseur, reglages de retry, cooldown de sante, dimensions/steps par defaut. **Aucun secret dans le
fichier de config** — les cles viennent des variables d'environnement (voir `.env.example`).

## Setup

```bash
cd MCP/image-generation
npm install
cp .env.example .env       # renseigner les cles fournisseurs (au moins une)
npm start                  # serveur MCP stdio
```

## Tests

```bash
npm test        # node:test — fournisseurs mockes, aucun appel reseau, aucune cle requise
npm run typecheck
```

Couvre : ordre de bascule du provider-manager, bornes/backoff du retry-manager, cooldown du health-monitor.

## Statut

`implemente` — Phase 1 (avancee depuis Phase 3 a la demande de Reda). Failover multi-fournisseurs
fonctionnel, teste hors ligne.
