# Commands — EtsyOS

## Workflows GitHub Actions

| Workflow | Frequence | Couvre |
|---|---|---|
| `hourly.yml` | 0 * * * * | Market-Scan, Printify-Sync, Health-Check |
| `daily.yml` | 0 6 * * * | Competitor-Scan, Trend-Discovery, Product-Generation, SEO-Optimization, Mockup-Generation, Publishing, Analytics, Optimization, Backup |
| `weekly.yml` | 0 21 * * 0 | Weekly-Review, Learning, Cleanup |
| `market.yml` | 0 */4 * * * | Market-Scan, Trend-Discovery |
| `publish.yml` | 0 8 * * * | Publishing, Printify-Sync |
| `analytics.yml` | 0 7 * * * | Analytics |
| `optimizer.yml` | 0 9 * * * | Optimization, SEO-Optimization |
| `backup.yml` | 0 3 * * * | Backup |
| `tests.yml` | push/PR | Suite de tests du repo (agents, MCP, scripts) |
| `lint.yml` | push/PR | Lint markdown, YAML, JSON, scripts |
| `health.yml` | */30 * * * * | Health-Check |
| `security.yml` | 0 4 * * * | Scan des secrets, dependances, politique Etsy |

## Declenchement manuel

Tous les workflows planifies supportent `workflow_dispatch` pour un declenchement manuel depuis l'onglet
Actions de GitHub.

## Statut

Squelettes uniquement — voir ROADMAP.md pour l'implementation de la logique metier.
