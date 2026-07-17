# Agents — EtsyOS

13 agents specialises, chacun avec un role unique et une memoire locale.

| Agent | Role |
|---|---|
| `Market-Agent` | Analyse le marche Etsy, identifie les niches rentables, detecte les opportunites via le MCP `market`. |
| `SEO-Agent` | Genere titres, tags et descriptions optimises SEO pour chaque listing via le MCP `seo`. |
| `Publishing-Agent` | Publie les listings sur Etsy et cree les produits correspondants sur Printify via les MCP `etsy`, `printify`, `publishing`. |
| `Analytics-Agent` | Suit quotidiennement les performances des listings et du compte via le MCP `analytics`. |
| `Design-Agent` | Genere images et mockups produits via le MCP `higgsfield` et le MCP `assets`. |
| `Learning-Agent` | Apprend des resultats passes, ajuste les strategies des autres agents, alimente `07-Knowledge`. |
| `Quality-Agent` | Controle qualite (copyright, politique Etsy, doublons, qualite image/SEO) avant toute publication via le MCP `quality`. |
| `Pricing-Agent` | Determine et ajuste la strategie de prix via le MCP `pricing`. |
| `Trend-Agent` | Detecte les tendances emergentes sur Etsy et au-dela via le MCP `market` et `competitor`. |
| `Experiment-Agent` | Pilote les tests A/B (titres, prix, mockups, descriptions, tags, images) via le MCP `experiments`. |
| `Knowledge-Agent` | Maintient et interroge la base de connaissances du systeme via le MCP `knowledge`. |
| `Planning-Agent` | Planifie les routines, arbitre les priorites et les ressources entre agents. |
| `Asset-Manager-Agent` | Gere le cycle de vie des assets (stockage, versions, nettoyage) via le MCP `assets` et `storage`. |

## Contrat commun

Chaque agent expose : `README.md` (role, responsabilites, I/O, statut), `config.yml` (parametres),
`Prompts/` (bibliotheque de prompts), `Memory/` (etat local persistant).

## Regle

Un agent ne parle jamais directement a une API externe — il passe systematiquement par un serveur MCP.

## Statut

Squelettes uniquement — voir ROADMAP.md pour l'ordre d'implementation.
