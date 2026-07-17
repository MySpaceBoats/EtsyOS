# Exemples d'appel — MCP etsy (vendored `@mcpengine/etsy`)

Noms d'outils exacts a verifier dans `vendor/etsy-mcp-2026-complete/src/tools/` (peuvent evoluer avec les
mises a jour du vendor). Exemples a la date du vendoring :

## `etsy_shop_get`

```json
{ "shop_id": "12345678" }
```

## `etsy_listings_list_by_shop`

```json
{ "shop_id": "12345678", "limit": 10, "offset": 0 }
```

## Outils d'ecriture — a ne PAS invoquer avant Phase 4 (Quality-Agent)

`etsy_listing_create`, `etsy_listing_update`, `etsy_listing_delete`, `etsy_receipt_update`, etc. existent
mais ne sont couverts par aucun controle qualite avant publication tant que `Quality-Agent` n'existe pas —
voir README.md "⚠️ Not read-only".
