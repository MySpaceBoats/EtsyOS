# Interface — MCP assets

Transport: stdio. Protocol: MCP. Server name: `assets`.

## `record_asset`

Entree (`metadata`) — `prompt`, `provider`, `model` requis ; le reste optionnel :

```json
{
  "prompt": "string",
  "provider": "string",
  "model": "string",
  "category": "Images",
  "slug": "string",
  "date": "YYYY-MM-DD",
  "negativePrompt": "string",
  "seed": 42,
  "generationTimeMs": 800,
  "retries": 0,
  "estimatedCostUsd": 0.0,
  "width": 1024,
  "height": 1024,
  "r2Url": "https://.../images/x.png",
  "r2Key": "images/x.png",
  "checksum": "sha256-hex",
  "status": "generated"
}
```

Sortie : `{ "path": string }` — chemin absolu de la fiche ecrite.

## Comportement

- Ecrit `Assets/<category>/<date>-<slug>.md` (categorie defaut `Images`, date defaut aujourd'hui,
  slug derive du prompt si absent).
- `category` et `slug` sont assainis (`[a-z0-9-]`), ce qui empeche toute traversee de repertoire.
- Champs non fournis serialises en `null` dans le frontmatter (jamais omis).
- Repertoire racine : `<repo>/Assets`, ou `ASSETS_BASE_DIR` si defini.
