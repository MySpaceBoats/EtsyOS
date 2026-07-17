# Deployment — EtsyOS

## Principe

Aucun serveur a deployer. L'execution se fait entierement via GitHub Actions (runners ephemeres) + serveurs
MCP invoques par Claude Code.

## Infrastructure

- **Cloudflare R2** — stockage des assets (voir `/Storage`, `/Infrastructure`)
- **GitHub Actions** — seul environnement d'execution planifiee
- **Secrets** — geres exclusivement via GitHub Actions secrets (jamais en clair dans le repo)

## Environnements

Un seul environnement pour l'instant (production). Pas de staging — chaque routine doit etre testee via
`workflow_dispatch` avant d'etre laissee sur son cron.

## Statut

A implementer — voir ROADMAP.md Phase 1.
