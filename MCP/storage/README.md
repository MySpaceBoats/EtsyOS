---
type: mcp-server
layer: mcp
created: 2026-07-17
updated: 2026-07-17
status: implemente
---

# MCP — storage

## Role

Interface de stockage S3-compatible (Cloudflare R2) pour les assets binaires d'EtsyOS (images, mockups,
exports). Signature AWS SigV4 via [`aws4fetch`](https://github.com/mhart/aws4fetch) (zero-dep, sur `fetch`) —
pas de `@aws-sdk`, trop lourd pour ce besoin.

## Outils exposes

| Outil | Entree | Sortie |
|---|---|---|
| `upload` | `key`, `contentBase64`, `contentType` | `{ key, url, checksum }` (checksum = sha256 hex) |
| `download` | `key` | `{ contentBase64, contentType }` |
| `delete` | `key` | `{ deleted: true }` |
| `list` | `prefix?` | `{ keys: [...] }` |
| `getSignedUrl` | `key`, `expiresInSeconds` | `{ url }` (presigned GET, buckets prives) |
| `publicUrl` | `key` | `{ url }` (bucket public, requiert `R2_PUBLIC_URL_BASE`) |

Voir `interface.md` pour le detail des schemas.

## Configuration

Aucun secret commite. Variables d'environnement (voir `.env.example`) :

- `R2_ACCOUNT_ID` — id de compte Cloudflare
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — cle d'acces R2 (S3 API token)
- `R2_BUCKET` — nom du bucket
- `R2_ENDPOINT` — optionnel, defaut `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_PUBLIC_URL_BASE` — optionnel, domaine public du bucket (custom domain ou `pub-<hash>.r2.dev`)

## Setup

```bash
cd MCP/storage
npm install
cp .env.example .env       # renseigner les credentials R2
npm start                  # serveur MCP stdio
```

## Tests

```bash
npm test        # node:test, fetch monkeypatche — aucun appel reseau, aucun credential requis
npm run typecheck
```

## Statut

`implemente` — client R2 fonctionnel (upload/download/delete/list/getSignedUrl/publicUrl), teste hors ligne.
