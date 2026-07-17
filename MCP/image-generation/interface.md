# Interface — MCP image-generation

Transport: stdio. Protocol: MCP. Server name: `image-generation`.

## `generate_image`

Entree :

```json
{
  "prompt": "string",
  "options": {
    "negativePrompt": "string",
    "width": 1024,
    "height": 1024,
    "seed": 42,
    "steps": 4,
    "extra": {}
  }
}
```

`options` et tous ses champs sont optionnels ; `width`/`height`/`steps` non fournis retombent sur les
`defaults` de la config. `extra` est passe tel quel au fournisseur retenu.

Sortie (`content[0].text`, JSON stringifie) — `ProviderResult` :

```json
{
  "imageBase64": "string",
  "mimeType": "image/jpeg",
  "provider": "workers-ai",
  "model": "@cf/black-forest-labs/flux-1-schnell",
  "seed": 42,
  "generationTimeMs": 1234
}
```

Le fournisseur effectivement utilise est expose via `provider`/`model`. L'appelant n'a pas a savoir lequel
a servi la requete.

## Bascule et erreurs

- Les fournisseurs sont essayes dans l'ordre `priority` de la config.
- Un fournisseur en cooldown (`quota`/`rate_limit` recent) est saute sans appel.
- Les erreurs `retryable` sont retentees (backoff borne) avant de basculer.
- Si tous les fournisseurs echouent : `AllProvidersFailedError` avec le detail par fournisseur
  (`{ "workers-ai": "quota", "imagen": "http_error", ... }`).
