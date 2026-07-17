---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Analytics

## Declencheur

GitHub Actions — frequence : `daily` (voir `.github/workflows/daily.yml`).

## Frequence

`daily`

## Dependances

Agents/Analytics-Agent, MCP/analytics

## Description

Collecte quotidienne des metriques de performance.

## Logs

Chaque execution ecrit un log dans `/Logs/Analytics/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

