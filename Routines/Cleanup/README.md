---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Cleanup

## Declencheur

GitHub Actions — frequence : `weekly` (voir `.github/workflows/weekly.yml`).

## Frequence

`weekly`

## Dependances

MCP/storage, MCP/assets

## Description

Nettoyage des assets, logs et donnees temporaires obsoletes.

## Logs

Chaque execution ecrit un log dans `/Logs/Cleanup/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

