# MCP Servers — EtsyOS

15 serveurs MCP, un par domaine d'integration. Aucun agent ne parle a une API externe sans passer par son
serveur MCP dedie.

| Serveur | Role | Statut |
|---|---|---|
| `etsy` | Integration API Etsy — 50+ outils (vendored, voir THIRD_PARTY_NOTICES.md). | Phase 1 — auth OK, CRUD complet |
| `printify` | Integration API Printify (npm `@tsavo/printify-mcp`, voir THIRD_PARTY_NOTICES.md). | Phase 1 — auth OK, CRUD complet |
| `higgsfield` | Generation d'images et de mockups — hosted remote MCP (`mcp.higgsfield.ai/mcp`). | Identifie, auth headless a resoudre |
| `market` | Analyse de marche Etsy — niches, volumes de recherche, opportunites. | Squelette |
| `seo` | Generation SEO — mots-cles, titres, descriptions, tags. | Squelette |
| `analytics` | Collecte et agregation des metriques de performance. | Squelette |
| `storage` | Interface de stockage S3-compatible (Cloudflare R2). | Squelette |
| `quality` | Controle qualite pre-publication (copyright, politique Etsy, doublons). | Squelette |
| `competitor` | Analyse des concurrents — boutiques, listings, prix, positionnement. | Squelette |
| `pricing` | Strategie et calcul de prix. | Squelette |
| `assets` | Gestion du cycle de vie des assets generes. | Squelette |
| `knowledge` | Lecture/ecriture de la base de connaissances persistante. | Squelette |
| `experiments` | Framework d'A/B testing — creation, suivi, resultats. | Squelette |
| `notifications` | Notifications systeme (rapports, alertes, erreurs). | Squelette |
| `publishing` | Orchestration de la publication cross-plateforme (Etsy + Printify). | Squelette |

## Contrat commun

Chaque serveur MCP expose : `README.md` (role), `interface.md` (methodes, schemas), `config.example.json`
(configuration sans secrets), `examples/` (exemples d'appel), `tests/` (tests, quand applicable).

## Vendored vs squelette

`etsy` et `printify` ne sont pas construits maison — voir THIRD_PARTY_NOTICES.md pour la provenance et la
licence de chaque dependance/submodule. Les deux exposent bien plus que de la lecture seule ; voir la
section "⚠️ Not read-only" de chaque README avant de les invoquer depuis un agent/routine.

## Statut

Squelettes pour les 12 autres serveurs — voir ROADMAP.md pour l'ordre d'implementation (Phase 1 : `etsy`,
`printify` faits, `storage` reste a faire).
