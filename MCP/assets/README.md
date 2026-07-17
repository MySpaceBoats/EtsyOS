---
type: mcp-server
layer: mcp
created: 2026-07-17
updated: 2026-07-17
status: partiellement-implemente
---

# MCP — assets

## Role

Gestion du cycle de vie des assets generes. Portee actuelle : **enregistrement de fiche uniquement**
(`record_asset`). Le reste du cycle de vie (indexation, deduplication, purge, versionnage, liens produits)
reste a construire — voir "Travaux futurs".

## Outils exposes

| Outil | Entree | Sortie |
|---|---|---|
| `record_asset` | `metadata` (prompt, provider, model, ...) | `{ path }` |

`record_asset` ecrit une fiche Obsidian sous `Assets/<category>/<YYYY-MM-DD>-<slug>.md` (categorie par
defaut `Images`) avec un frontmatter `type: asset` / `layer: assets` et les champs de provenance de
generation (provider, model, prompt, seed, temps, cout estime, dimensions, URL/clef R2, checksum).

Voir `interface.md` pour le contrat complet.

## Configuration

Aucun secret. Le repertoire racine des fiches est `<repo>/Assets` par defaut, surchargeable via
`ASSETS_BASE_DIR` (voir `.env.example`).

## Setup

```bash
cd MCP/assets
npm install
npm start                  # serveur MCP stdio
```

## Tests

```bash
npm test        # node:test — ecrit dans un repertoire temporaire, aucun effet de bord dans le Vault
npm run typecheck
```

## Travaux futurs

- Indexation / recherche des assets enregistres
- Deduplication par checksum
- Cycle de vie (statuts, purge, versionnage)
- Liens bidirectionnels vers les fiches produit

## Statut

`partiellement-implemente` — `record_asset` fonctionnel et teste ; reste du cycle de vie a venir.
