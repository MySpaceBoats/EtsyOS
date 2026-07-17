# Architecture — EtsyOS

## Principe directeur

Claude Code est l'unique orchestrateur. GitHub Actions declenche les routines sur des cadences fixes. Les
routines invoquent des agents specialises. Les agents appellent des serveurs MCP pour toute integration
externe (Etsy, Printify, generation d'images, stockage). Aucune logique n'est deleguee a un orchestrateur
tiers.

## Flux general

```
GitHub Actions (cron)
      -> Routine (declencheur + logs + recuperation)
            -> Agent(s) specialise(s) (raisonnement, decision)
                  -> Serveur(s) MCP (execution, integration externe)
                        -> Etsy / Printify / Higgsfield / R2 / ...
                              -> Knowledge (memoire persistante)
                                    -> Vault Obsidian (visibilite humaine, decisions)
```

## Couches

1. **Core** — configuration centrale, etat global, points d'entree lus par Claude Code au demarrage de chaque
   routine.
2. **Agents** — raisonnement specialise. Chaque agent a un role, une memoire locale (`Agents/<Agent>/Memory/`)
   et interroge la memoire partagee (`Knowledge/`).
3. **MCP** — la seule couche autorisee a parler a l'exterieur (API Etsy, API Printify, generation d'image,
   stockage S3). Un agent n'appelle jamais une API externe directement.
4. **Routines** — sequences documentees d'appels agents/MCP, declenchees par GitHub Actions, avec logs et
   recuperation apres erreur.
5. **Vault Obsidian (00-24)** — couche de visibilite humaine et de memoire long terme lisible par Reda. Ne
   duplique jamais le contenu operationnel (Products/, MCP/, Agents/) — y renvoie via wiki-links.

## Stockage

- **Cloudflare R2** (compatible S3) pour les assets binaires (images, mockups, exports).
- **Obsidian Markdown** pour toute donnee structurable en connaissance (decisions, rapports, historique).
- Aucun secret dans le Vault — voir SECURITY.md.

## Modules

Voir MCP.md, AGENTS.md, ROUTINES.md pour le detail contractuel de chaque module.

## Statut

Fondation — voir ROADMAP.md pour les prochaines implementations.
