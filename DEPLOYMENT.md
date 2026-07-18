# Deployment — EtsyOS

## Principe

Deux surfaces deployees, toutes deux automatisees par GitHub Actions :

1. **Le Workflow Engine** (`Core/engine`) — aucun serveur a deployer, execute par Claude Code et par les
   routines GitHub Actions (runners ephemeres) + serveurs MCP.
2. **Le Web — EtsyOS Control Center** — deploye automatiquement sur **Cloudflare Pages** a chaque push sur
   `main` via `.github/workflows/deploy.yml` : Tests → Build → Deploiement → Invalidation du cache → Mise en
   ligne. Voir Web/README.md pour le detail du workflow et des secrets requis.

## Infrastructure

- **Cloudflare R2** — stockage des assets, source unique de verite (voir `/Storage`, `/Infrastructure`)
- **Cloudflare Pages** — hebergement du Control Center, integre a GitHub pour le deploiement automatique
- **Cloudflare Access** — protection du Control Center (allowlist d'emails, zero code applicatif)
- **GitHub Actions** — execution planifiee du moteur (routines) + CI (tests, deploiement)
- **Secrets** — geres exclusivement via GitHub Actions secrets / Cloudflare Pages env vars (jamais en clair
  dans le repo)

## Secrets a configurer (Reda)

| Secret | Ou | Role |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub Actions | Deploiement Cloudflare Pages (`deploy.yml`) |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions | Compte du projet Pages |
| `GITHUB_TOKEN` (PAT fine-grained) | Cloudflare Pages env var | Lecture/ecriture des fiches et de `Core/state` par le Control Center |
| `ETSY_CLIENT_ID`, `PRINTIFY_API_TOKEN`, `R2_*` | GitHub Actions | MCP invoques par les routines — voir ROADMAP.md Phase 1 |

## Environnements

Un seul environnement pour l'instant (production). Pas de staging — chaque routine doit etre testee via
`workflow_dispatch` avant d'etre laissee sur son cron.

## Statut

Web/Control Center : deploiement automatique cable (`deploy.yml`) — creation du projet Pages et des secrets
reste une etape manuelle une fois (voir Web/README.md). Routines du moteur : a cabler au fil de la ROADMAP
Phase 1-2.
