---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Trend Discovery

## Declencheur

GitHub Actions — frequence : `daily` (voir `.github/workflows/daily.yml`).

## Frequence

`daily`

## Dependances

Agents/Trend-Agent, MCP/market

## Description

Decouverte de nouvelles tendances de recherche et de produits.

## Logs

Chaque execution ecrit un log dans `/Logs/Trend-Discovery/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

