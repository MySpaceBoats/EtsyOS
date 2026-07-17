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

- [x] MCP `etsy` — auth OAuth2 PKCE (wrapper maison) + serveur vendored `etsy-mcp-2026-complete` (50+ outils,
      voir THIRD_PARTY_NOTICES.md) — smoke-teste bout-en-bout
- [x] MCP `printify` — auth token personnel + dependance npm `@tsavo/printify-mcp` — smoke-teste bout-en-bout
- [ ] **Gate d'ecriture** — les deux MCP exposent du CRUD complet, pas juste de la lecture comme prevu
      initialement. Rien n'empeche aujourd'hui la creation/suppression d'un listing/produit avant Phase 4
      (`Quality-Agent`). Discipline de prompt uniquement pour l'instant — voir README.md de chaque MCP.
- [ ] Secrets GitHub Actions (Etsy API, Printify API, Higgsfield, R2) — a configurer par Reda, voir INSTALL.md
- [ ] Persistance du `refresh_token` Etsy sur runner ephemere (voir MCP/etsy/README.md "Limitation connue")
- [ ] MCP `storage` — client R2 fonctionnel
- [ ] Routine `Health-Check` fonctionnelle

## Phase 2 — Marche & connaissance (priorite 2)

- [ ] MCP `market`, `competitor`
- [ ] Agent `Market-Agent`, `Trend-Agent`
- [ ] Routine `Market-Scan`, `Competitor-Scan`, `Trend-Discovery`
- [ ] MCP `knowledge` + premiere structure de memoire persistante

## Phase 3 — Creation produit (priorite 3)

- [ ] MCP `higgsfield` — resoudre l'auth headless (hosted remote MCP, auth navigateur par defaut — voir
      MCP/higgsfield/README.md) avant de l'utiliser depuis une routine GitHub Actions
- [ ] MCP `seo`, `assets`
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

1. Reda : creer l'app Etsy (developer.etsy.com), le token Printify, et configurer les secrets GitHub Actions
2. Reda : `git submodule update --init MCP/etsy/vendor/etsy-mcp-2026-complete`, puis `cd MCP/etsy && npm run authorize` une fois `ETSY_CLIENT_ID` renseigne, reporter `ETSY_SHOP_ID`
3. Definir le gate d'ecriture (allowlist d'outils MCP en lecture seule tant que `Quality-Agent` n'existe pas)
4. Resoudre la persistance du refresh token Etsy pour les runners GitHub Actions (ephemeres)
5. Implementer MCP `storage` (client R2) + Routine `Health-Check`
6. Premiere iteration de `Market-Agent` + MCP `market` (donnees reelles, pas de mock)
