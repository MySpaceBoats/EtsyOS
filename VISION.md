# Vision — EtsyOS

## Objectif

Construire un systeme capable de faire fonctionner une activite Etsy de bout en bout avec une intervention
humaine minimale : decouverte de niches, creation produit, publication, suivi, optimisation, apprentissage.

## Ce que le systeme doit savoir faire

- Decouvrir automatiquement de nouvelles niches rentables
- Analyser le marche Etsy et les concurrents
- Determiner quelles opportunites valent la peine
- Generer des idees de produits, les creer, generer images/mockups/SEO
- Publier automatiquement les listings Etsy et les produits Printify
- Synchroniser Etsy <-> Printify
- Suivre quotidiennement les performances et optimiser les listings
- Apprendre de ses propres resultats et enrichir sa memoire
- Conserver l'historique complet de toutes ses decisions

## Ce que le systeme ne doit jamais faire

- Deleguer l'orchestration a un outil externe (n8n, Zapier, Make)
- Publier sans passer par le pipeline QA (Quality-Agent)
- Inventer des donnees (ventes, concurrents, sources) — toute donnee non verifiee est marquee explicitement

## Horizon

Ce depot documente la fondation. L'implementation de la logique metier (agents, MCP) suit l'ordre de
ROADMAP.md, en commencant par l'authentification/securite et l'infrastructure.
