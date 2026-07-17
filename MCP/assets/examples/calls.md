# Exemples d'appel — MCP assets

## `record_asset`

```json
{
  "prompt": "watercolor fox, soft pastel palette, white background",
  "provider": "workers-ai",
  "model": "@cf/black-forest-labs/flux-1-schnell",
  "category": "Images",
  "seed": 12345,
  "generationTimeMs": 842,
  "retries": 0,
  "estimatedCostUsd": 0.0,
  "width": 1024,
  "height": 1024,
  "r2Url": "https://cdn.example.com/images/2026-07-17-watercolor-fox.png",
  "r2Key": "images/2026-07-17-watercolor-fox.png",
  "checksum": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "status": "generated"
}
```

Reponse : `{ "path": "/abs/path/EtsyOS/Assets/images/2026-07-17-watercolor-fox.md" }`
