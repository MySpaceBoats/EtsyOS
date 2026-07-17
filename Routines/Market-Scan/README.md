---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Market Scan

## Declencheur

GitHub Actions — frequence : `hourly` (voir `.github/workflows/hourly.yml`).

## Frequence

`hourly`

## Dependances

Agents/Market-Agent, MCP/market

## Description

Scan du marche Etsy pour reperer opportunites et tendances.

## Logs

Chaque execution ecrit un log dans `/Logs/Market-Scan/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

