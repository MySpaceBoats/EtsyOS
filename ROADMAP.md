# Roadmap — EtsyOS

## Phase 0 — Fondation (cette livraison)

- [x] Architecture complete et coherente
- [x] Tous les dossiers (software + Obsidian)
- [x] Tous les README
- [x] Templates de base
- [x] Documentation racine
- [x] GitHub Actions (squelettes documentes)
- [x] Structure des agents (13)
- [x] Structure des MCP (15)
- [x] Structure des routines (15)
- [x] Structure Obsidian (25 dossiers)
- [x] Conventions du projet

## Phase 1 — Authentification & infrastructure (priorite 1)

- [ ] Secrets GitHub Actions (Etsy API, Printify API, Higgsfield, R2)
- [ ] MCP `etsy` — auth OAuth + lecture seule (shop, listings)
- [ ] MCP `printify` — auth API key + lecture seule (catalogue, produits)
- [ ] MCP `storage` — client R2 fonctionnel
- [ ] Routine `Health-Check` fonctionnelle

## Phase 2 — Marche & connaissance (priorite 2)

- [ ] MCP `market`, `competitor`
- [ ] Agent `Market-Agent`, `Trend-Agent`
- [ ] Routine `Market-Scan`, `Competitor-Scan`, `Trend-Discovery`
- [ ] MCP `knowledge` + premiere structure de memoire persistante

## Phase 3 — Creation produit (priorite 3)

- [ ] MCP `seo`, `higgsfield`, `assets`
- [ ] Agent `SEO-Agent`, `Design-Agent`
- [ ] Routine `Product-Generation`, `SEO-Optimization`, `Mockup-Generation`

## Phase 4 — Publication (priorite 4)

- [ ] MCP `publishing`, `quality`
- [ ] Agent `Publishing-Agent`, `Quality-Agent`
- [ ] Routine `Publishing`, `Printify-Sync`

## Phase 5 — Performance & apprentissage (priorite 5)

- [ ] MCP `analytics`, `pricing`, `experiments`
- [ ] Agent `Analytics-Agent`, `Pricing-Agent`, `Experiment-Agent`, `Learning-Agent`
- [ ] Routine `Analytics`, `Optimization`, `Weekly-Review`, `Learning`

## Phase 6 — Maintenance

- [ ] Routine `Backup`, `Cleanup`
- [ ] MCP `notifications`
- [ ] Agent `Planning-Agent`, `Asset-Manager-Agent`

## Priorites immediates (prochaine session)

1. Definir les secrets et l'auth Etsy/Printify (bloquant pour tout le reste)
2. Implementer MCP `etsy` en lecture seule
3. Implementer Routine `Health-Check`
4. Premiere iteration de `Market-Agent` + MCP `market` (donnees reelles, pas de mock)
