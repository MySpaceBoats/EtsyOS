# Routines — EtsyOS

15 routines independantes, chacune declenchee par un workflow GitHub Actions.

| Routine | Frequence | Dependances |
|---|---|---|
| `Market-Scan` | hourly | Agents/Market-Agent, MCP/market |
| `Competitor-Scan` | daily | Agents/Market-Agent, MCP/competitor |
| `Trend-Discovery` | daily | Agents/Trend-Agent, MCP/market |
| `Product-Generation` | daily | Agents/Market-Agent, Agents/Design-Agent |
| `SEO-Optimization` | daily | Agents/SEO-Agent, MCP/seo |
| `Mockup-Generation` | daily | Agents/Design-Agent, MCP/higgsfield |
| `Publishing` | daily | Agents/Publishing-Agent, Agents/Quality-Agent |
| `Printify-Sync` | hourly | MCP/printify, MCP/etsy |
| `Analytics` | daily | Agents/Analytics-Agent, MCP/analytics |
| `Optimization` | daily | Agents/SEO-Agent, Agents/Pricing-Agent |
| `Weekly-Review` | weekly | Agents/Planning-Agent |
| `Learning` | weekly | Agents/Learning-Agent, MCP/knowledge |
| `Backup` | daily | MCP/storage |
| `Health-Check` | hourly | Core |
| `Cleanup` | weekly | MCP/storage, MCP/assets |

## Contrat commun

Chaque routine expose : `README.md` (declencheur, frequence, dependances, logs, recuperation apres erreur).

## Regle

Toute routine doit etre idempotente — une re-execution apres echec ne doit jamais dupliquer une action deja
effectuee (publication, ecriture memoire, etc.).

## Statut

Squelettes uniquement — voir ROADMAP.md pour l'ordre d'implementation.
