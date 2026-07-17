# Contributing — EtsyOS

## Conventions

- Un commit = un changement logique, message explicite (voir historique pour le style)
- Chaque agent/MCP/routine documente son contrat avant toute implementation de logique
- Ne jamais dupliquer un contenu deja documente ailleurs dans le Vault — lier, ne pas copier
- Toute nouvelle integration externe passe par un serveur MCP dedie, jamais un appel direct depuis un agent
- Respecter la structure de dossiers definie dans ARCHITECTURE.md — ne pas creer de dossier hors convention

## Style Markdown

- Frontmatter YAML obligatoire sur toute note (`type`, `layer`, `created`, `updated`, `status`)
- Liens internes en `[[wiki-links]]`
- Pas de lien casse — ne lier qu'a une note existante ou creee dans la meme operation

## Ponytail

Ce projet suit une discipline de minimalisme de code : ne rien construire au-dela de ce qui est demande,
prefererer stdlib/plateforme/dependance deja installee avant d'ajouter quoi que ce soit.
