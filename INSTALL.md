# Installation — EtsyOS

## Prerequis

- Compte GitHub avec Actions active (org MySpaceBoats)
- Compte Etsy API (developer.etsy.com) + shop existant
- Compte Printify API
- Compte Cloudflare R2 (ou stockage compatible S3)
- Claude Code CLI configure avec acces MCP
- Obsidian (optionnel, pour la navigation humaine du Vault)

## Etapes

1. Cloner le depot avec ses submodules : `git clone --recurse-submodules git@github.com:MySpaceBoats/EtsyOS.git`
   (deja clone sans `--recurse-submodules` ? lancer `git submodule update --init` apres coup)
2. Ouvrir le dossier dans Obsidian comme Vault (racine du depot = racine du Vault)
3. Configurer les secrets GitHub Actions (Settings > Secrets and variables > Actions) :
   `ETSY_CLIENT_ID`, `ETSY_SHOP_ID`, `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID`, `HIGGSFIELD_API_KEY`,
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` (optionnel),
   `R2_PUBLIC_URL_BASE` (optionnel), `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `GOOGLE_AI_STUDIO_API_KEY`,
   `HUGGINGFACE_API_KEY`, `GITHUB_TOKEN` (PAT fine-grained, scope Contents:write — utilise par la console Web),
   `GITHUB_REPO` (`MySpaceBoats/EtsyOS`), `GITHUB_BRANCH` (`main`)
4. Verifier que les workflows `.github/workflows/health.yml` s'executent correctement
5. Suivre ROADMAP.md pour l'ordre d'implementation des MCP et agents

## Configuration locale (Claude Code)

Aucun secret n'est stocke dans le repo. Utiliser les variables d'environnement du runner GitHub Actions ou
un fichier `.env` local non commite (voir `.gitignore`).

## MCP — Etsy et Printify (Phase 1)

Les deux serveurs sont vendored depuis des projets MCP existants plutot que construits maison — voir
THIRD_PARTY_NOTICES.md. **Aucun des deux n'est en lecture seule** : voir la section "⚠️ Not read-only" de
chaque README avant de les utiliser depuis un agent.

```bash
# Etsy — submodule + OAuth2 PKCE, one-time
git submodule update --init MCP/etsy/vendor/etsy-mcp-2026-complete
cd MCP/etsy
npm install
cp .env.example .env      # renseigner ETSY_CLIENT_ID (developer.etsy.com)
npm run authorize          # ouvre une URL d'autorisation, capture le callback local,
                            # cache les tokens, affiche les shop IDs -> reporter dans ETSY_SHOP_ID
npm run vendor:build && npm start

# Printify — token personnel, dependance npm @tsavo/printify-mcp
cd ../printify
npm install
cp .env.example .env      # renseigner PRINTIFY_API_KEY (Printify > My Profile > Connections)
npm start
```

Une fois les deux `.env` remplis, `.mcp.json` a la racine du depot les enregistre automatiquement aupres de
Claude Code (avec `higgsfield`, en mode connecteur distant — auth via compte Higgsfield, pas de cle API).

## MCP — storage et image-generation (Phase 1)

Deux serveurs MCP construits maison, sans secret commite (variables d'environnement uniquement).

```bash
# storage — client Cloudflare R2 (S3-compatible)
cd MCP/storage
npm install
cp .env.example .env      # renseigner R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
                           # (R2_ENDPOINT et R2_PUBLIC_URL_BASE optionnels)
npm start

# image-generation — generation multi-fournisseurs avec bascule automatique
cd ../image-generation
npm install
cp .env.example .env      # renseigner au moins un fournisseur : CF_ACCOUNT_ID + CF_API_TOKEN (Workers AI),
                           # GOOGLE_AI_STUDIO_API_KEY (Imagen), HUGGINGFACE_API_KEY (HuggingFace)
npm start
```

`.mcp.json` enregistre automatiquement `storage` et `image-generation` aupres de Claude Code. Le serveur
`image-generation` essaie les fournisseurs dans l'ordre de priorite de `config.example.json` et bascule
automatiquement ; un seul fournisseur configure suffit pour demarrer.

## Web — console de validation

Application Next.js 15 (Cloudflare Pages) : le point de controle humain avant Printify/Etsy. Elle lit et ecrit
les fiches produit via la GitHub Contents API — jamais via le filesystem, jamais via Etsy/Printify/MCP (voir
Web/README.md, section « Frontiere de securite »).

```bash
cd Web
npm install                 # .npmrc force legacy-peer-deps (conflit next-on-pages / wrangler)
cp .env.example .env.local  # laisser GITHUB_TOKEN vide + MOCK_DATA=1 pour un dev sans token,
                            # ou renseigner GITHUB_TOKEN / GITHUB_REPO / GITHUB_BRANCH pour les vraies fiches
MOCK_DATA=1 npm run dev     # http://localhost:3000 avec les fiches de seed

npm run pages:build         # build adaptateur Cloudflare (@cloudflare/next-on-pages) — le build de deploiement
```

Variables d'environnement requises : `GITHUB_TOKEN` (PAT fine-grained, scope Contents: Read and write, **pas
encore cree**), `GITHUB_REPO` (`MySpaceBoats/EtsyOS`), `GITHUB_BRANCH` (`main`). `MOCK_DATA=1` reserve au
dev/CI, jamais en production.

Reglages du projet Cloudflare Pages : Root directory `Web`, Build command `npx @cloudflare/next-on-pages@1`,
Build output directory `.vercel/output/static`, compatibility flag `nodejs_compat`.

Etapes **manuelles une seule fois** (non scriptees, realisees par Reda apres la validation du build) : creation
du projet Cloudflare Pages + premier deploiement, integration git GitHub Actions, configuration de Cloudflare
Access (allowlist d'emails Zero Trust devant le projet Pages — l'auth n'est pas dans le code de l'app),
creation du `GITHUB_TOKEN` et ajout des secrets Pages (Production + Preview).
