# Interface — MCP storage

Transport: stdio. Protocol: MCP. Server name: `storage`.

Toutes les reponses d'outil sont retournees en `content[0].text` (JSON stringifie).

## `upload`

Entree :

```json
{ "key": "string", "contentBase64": "string", "contentType": "string" }
```

Sortie : `{ "key": string, "url": string, "checksum": string }` — `checksum` = sha256 hex des octets uploades.

## `download`

Entree : `{ "key": "string" }`

Sortie : `{ "contentBase64": string, "contentType": string }`

## `delete`

Entree : `{ "key": "string" }`

Sortie : `{ "deleted": true }`

## `list`

Entree : `{ "prefix": "string" }` (`prefix` optionnel)

Sortie : `{ "keys": string[] }`

## `getSignedUrl`

Entree : `{ "key": "string", "expiresInSeconds": number }`

Sortie : `{ "url": string }` — URL GET presignee (SigV4 query), pour bucket prive.

## `publicUrl`

Entree : `{ "key": "string" }`

Sortie : `{ "url": string }` — requiert `R2_PUBLIC_URL_BASE` ; leve une erreur sinon.

## Erreurs

Les reponses HTTP non-2xx de R2 sont normalisees en `Error("R2 <action> <key> failed: [<status>] <detail>")`
et propagees telles quelles dans la reponse d'outil MCP.
