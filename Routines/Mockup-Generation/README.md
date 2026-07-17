---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Mockup Generation

## Declencheur

GitHub Actions — frequence : `daily` (voir `.github/workflows/daily.yml`).

## Frequence

`daily`

## Dependances

Agents/Design-Agent, MCP/image-generation, MCP/storage, MCP/assets

## Description

Generation des mockups visuels pour chaque produit. Pipeline :

1. **generate** — `Design-Agent` appelle `MCP/image-generation` (`generate_image`), qui essaie les
   fournisseurs dans l'ordre de priorite (Workers AI -> Imagen -> HuggingFace) avec bascule automatique et
   retourne un `ProviderResult` unifie (`imageBase64`, `provider`, `model`, `seed`, `generationTimeMs`).
2. **upload** — l'image est poussee vers R2 via `MCP/storage` (`upload`), qui retourne `{ key, url,
   checksum }`.
3. **record** — une fiche d'asset est ecrite via `MCP/assets` (`record_asset`) sous
   `Assets/Images/<date>-<slug>.md` avec la provenance de generation + l'URL/clef R2.
4. **retour** — la routine expose l'URL R2 (publique ou presignee) du mockup pour la suite du flux produit.

`MCP/higgsfield` reste disponible comme alternative invoquee separement (Phase 3) tant que son auth
headless n'est pas resolue — non utilise par ce pipeline.

## Logs

Chaque execution ecrit un log dans `/Logs/Mockup-Generation/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

