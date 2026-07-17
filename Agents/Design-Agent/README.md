---
type: agent
layer: agents
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Design Agent

## Role

Genere images et mockups produits via le pipeline `MCP/image-generation` (chemin principal —
generation multi-fournisseurs avec bascule automatique), puis `MCP/storage` (upload R2) et
`MCP/assets` (fiche d'asset). Le MCP `higgsfield` reste disponible comme alternative invoquee
separement, en attente de la resolution de son auth headless (Phase 3).

## Responsabilites

- A definir lors de l'implementation — voir `03-Roadmap` pour la priorite d'implementation.

## Inputs / Outputs

| | |
|---|---|
| Inputs | A definir |
| Outputs | A definir |

## Prompts

Voir `Prompts/` dans ce dossier.

## Memoire

Cet agent lit/ecrit dans `Memory/` (etat local) et dans `/Knowledge` (memoire partagee long terme).

## Parametres

Voir `config.yml` dans ce dossier.

## Statut

`non-implemente` — squelette uniquement.

