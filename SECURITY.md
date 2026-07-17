# Security — EtsyOS

## Regles

- Aucun secret, cle API ou credential dans le code ou le Vault — utiliser les secrets GitHub Actions
- Aucun fichier `.env` commite
- Toute entree utilisateur/API externe est validee aux frontieres du systeme (MCP)
- Tout chemin de fichier manipule par un script est assaini (pas de traversee de repertoire)
- Toute action irreversible ou visible (publication Etsy, suppression, paiement) est explicitement loguee et
  tracee dans `17-Decisions/`

## Signalement

Signaler toute vulnerabilite via une issue GitHub privee ou directement a Reda Sebbani (MySpaceBoats).

## Scan automatique

Voir `.github/workflows/security.yml`.
