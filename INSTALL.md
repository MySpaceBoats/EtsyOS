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
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
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
