# EtsyOS

> Operating System autonome pour Etsy — pilote exclusivement par Claude Code, GitHub Actions et des serveurs MCP.
> Owner: Reda Sebbani (MySpaceBoats)

## Qu'est-ce qu'EtsyOS ?

EtsyOS n'est pas une boutique Etsy. C'est une plateforme d'automatisation complete capable de decouvrir des
niches, analyser le marche, generer des produits, les publier, suivre leurs performances et apprendre de ses
propres resultats — pratiquement sans intervention humaine.

**Aucun orchestrateur externe** (n8n, Zapier, Make). Claude Code est l'unique orchestrateur, via GitHub Actions
et des serveurs MCP.

Ce depot est aussi un **Vault Obsidian** directement utilisable — voir OBSIDIAN.md.

## Documentation

| Fichier | Contenu |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture technique complete |
| [VISION.md](VISION.md) | Vision et objectifs long terme |
| [ROADMAP.md](ROADMAP.md) | Feuille de route et priorites |
| [INSTALL.md](INSTALL.md) | Installation et prerequis |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Conventions de contribution |
| [SECURITY.md](SECURITY.md) | Politique de securite |
| [FAQ.md](FAQ.md) | Questions frequentes |
| [COMMANDS.md](COMMANDS.md) | Commandes et workflows disponibles |
| [MCP.md](MCP.md) | Liste et contrat des serveurs MCP |
| [AGENTS.md](AGENTS.md) | Liste et contrat des agents |
| [ROUTINES.md](ROUTINES.md) | Liste et contrat des routines |
| [OBSIDIAN.md](OBSIDIAN.md) | Usage du depot comme Vault Obsidian |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploiement et infrastructure |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions |

## Structure

Voir ARCHITECTURE.md pour le detail. Vue rapide :

```
EtsyOS/
  Core/ Agents/ Routines/ MCP/ Vault/ Knowledge/ Analytics/ Assets/
  Storage/ Templates/ Prompts/ Products/ Reports/ Logs/ Scripts/ Infrastructure/
  .github/workflows/
  00-Dashboard/ ... 24-Archive/   (navigation Obsidian)
```

## Statut

Fondation initiale — architecture, documentation et squelettes en place. Aucune logique metier des MCP/agents
implementee. Voir ROADMAP.md pour l'ordre d'implementation.
