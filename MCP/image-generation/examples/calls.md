# Exemples d'appel — MCP image-generation

## `generate_image` — minimal

```json
{ "prompt": "a minimalist line-art coffee mug on a plain background, product photography" }
```

## `generate_image` — avec options

```json
{
  "prompt": "watercolor fox, soft pastel palette, centered, white background",
  "options": {
    "negativePrompt": "text, watermark, low quality",
    "width": 1024,
    "height": 1024,
    "seed": 12345,
    "steps": 4
  }
}
```

Reponse (exemple) :

```json
{
  "imageBase64": "<base64>",
  "mimeType": "image/jpeg",
  "provider": "workers-ai",
  "model": "@cf/black-forest-labs/flux-1-schnell",
  "seed": 12345,
  "generationTimeMs": 842
}
```

Si `workers-ai` est en quota/rate-limit, la requete bascule automatiquement vers `imagen`, puis
`huggingface`, sans changement cote appelant.
