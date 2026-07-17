# MCP Servers — EtsyOS

15 serveurs MCP, un par domaine d'integration. Aucun agent ne parle a une API externe sans passer par son
serveur MCP dedie.

| Serveur | Role |
|---|---|
| `etsy` | Integration API Etsy — listings, shop, commandes, stats. |
| `printify` | Integration API Printify — produits POD, catalogues, commandes. |
| `higgsfield` | Generation d'images et de mockups via Higgsfield. |
| `market` | Analyse de marche Etsy — niches, volumes de recherche, opportunites. |
| `seo` | Generation SEO — mots-cles, titres, descriptions, tags. |
| `analytics` | Collecte et agregation des metriques de performance. |
| `storage` | Interface de stockage S3-compatible (Cloudflare R2). |
| `quality` | Controle qualite pre-publication (copyright, politique Etsy, doublons). |
| `competitor` | Analyse des concurrents — boutiques, listings, prix, positionnement. |
| `pricing` | Strategie et calcul de prix. |
| `assets` | Gestion du cycle de vie des assets generes. |
| `knowledge` | Lecture/ecriture de la base de connaissances persistante. |
| `experiments` | Framework d'A/B testing — creation, suivi, resultats. |
| `notifications` | Notifications systeme (rapports, alertes, erreurs). |
| `publishing` | Orchestration de la publication cross-plateforme (Etsy + Printify). |

## Contrat commun

Chaque serveur MCP expose : `README.md` (role), `interface.md` (methodes, schemas), `config.example.json`
(configuration sans secrets), `examples/` (exemples d'appel), `tests/` (tests).

## Statut

Squelettes uniquement — voir ROADMAP.md pour l'ordre d'implementation (Phase 1 : `etsy`, `printify`,
`storage`).
