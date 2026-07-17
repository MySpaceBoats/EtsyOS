---
type: routine
layer: routines
created: 2026-07-17
updated: 2026-07-17
status: active
---

# Backup

## Declencheur

GitHub Actions — frequence : `daily` (voir `.github/workflows/daily.yml`).

## Frequence

`daily`

## Dependances

MCP/storage

## Description

Sauvegarde de l'etat du systeme et des donnees critiques vers Cloudflare R2.

## Logs

Chaque execution ecrit un log dans `/Logs/Backup/YYYY-MM-DD.md`.

## Recuperation apres erreur

A definir lors de l'implementation — chaque routine doit etre idempotente et reprenable sans double-execution.

## Statut

`non-implemente` — squelette uniquement.

