# Exemples d'appel — MCP printify (vendored `@tsavo/printify-mcp`)

Noms d'outils reels (kebab-case, cote upstream) :

## `get-printify-status`

```json
{}
```

Retourne l'etat de connexion et la boutique actuellement selectionnee.

## `list-shops`

```json
{}
```

## `list-products`

```json
{ "page": 1, "limit": 10 }
```

Opere sur la boutique courante (`PRINTIFY_SHOP_ID` ou la premiere boutique auto-selectionnee) — pas de
parametre `shop_id` explicite, contrairement a l'API brute.

## Outils d'ecriture — a ne PAS invoquer avant Phase 4 (Quality-Agent)

`create-product`, `update-product`, `delete-product`, `publish-product` existent mais ne sont couverts par
aucun controle qualite avant publication — voir README.md "⚠️ Not read-only".
