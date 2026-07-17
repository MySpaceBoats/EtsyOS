# Exemples d'appel — MCP storage

## `upload`

```json
{
  "key": "images/2026-07-17-mug-mockup.png",
  "contentBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC",
  "contentType": "image/png"
}
```

Reponse : `{ "key": "images/2026-07-17-mug-mockup.png", "url": "https://<account>.r2.cloudflarestorage.com/<bucket>/images/2026-07-17-mug-mockup.png", "checksum": "<sha256-hex>" }`

## `download`

```json
{ "key": "images/2026-07-17-mug-mockup.png" }
```

## `delete`

```json
{ "key": "images/2026-07-17-mug-mockup.png" }
```

## `list`

```json
{ "prefix": "images/" }
```

## `getSignedUrl`

```json
{ "key": "images/2026-07-17-mug-mockup.png", "expiresInSeconds": 900 }
```

## `publicUrl`

```json
{ "key": "images/2026-07-17-mug-mockup.png" }
```
