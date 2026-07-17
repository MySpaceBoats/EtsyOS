# Installation — EtsyOS

## Prerequis

- Compte GitHub avec Actions active (org MySpaceBoats)
- Compte Etsy API (developer.etsy.com) + shop existant
- Compte Printify API
- Compte Cloudflare R2 (ou stockage compatible S3)
- Claude Code CLI configure avec acces MCP
- Obsidian (optionnel, pour la navigation humaine du Vault)

## Etapes

1. Cloner le depot : `git clone git@github.com:MySpaceBoats/EtsyOS.git`
2. Ouvrir le dossier dans Obsidian comme Vault (racine du depot = racine du Vault)
3. Configurer les secrets GitHub Actions : `ETSY_API_KEY`, `PRINTIFY_API_KEY`, `HIGGSFIELD_API_KEY`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
4. Verifier que les workflows `.github/workflows/health.yml` s'executent correctement
5. Suivre ROADMAP.md pour l'ordre d'implementation des MCP et agents

## Configuration locale (Claude Code)

Aucun secret n'est stocke dans le repo. Utiliser les variables d'environnement du runner GitHub Actions ou
un fichier `.env` local non commite (voir `.gitignore`).
