---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Printify Sync

## Declencheur

GitHub Actions — frequence : `hourly` (voir `.github/workflows/hourly.yml`).

## Frequence

`hourly`

## Dependances

MCP/printify, MCP/etsy

## Description

Synchronisation des produits et stocks entre Etsy et Printify.

## Logs

Chaque execution ecrit un log dans `/Logs/Printify-Sync/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

