---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Health Check

## Declencheur

GitHub Actions — frequence : `hourly` (voir `.github/workflows/hourly.yml`).

## Frequence

`hourly`

## Dependances

Core

## Description

Verification de la sante du systeme et des integrations MCP.

## Logs

Chaque execution ecrit un log dans `/Logs/Health-Check/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

