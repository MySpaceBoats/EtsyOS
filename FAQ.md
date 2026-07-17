# FAQ — EtsyOS

**Pourquoi pas n8n/Zapier/Make ?**
Choix architectural deliberé — Claude Code + GitHub Actions + MCP couvrent l'orchestration sans dependance a
un outil tiers, avec un historique de decisions et une memoire versionnee dans Git.

**Le depot est-il un Vault Obsidian ou un depot de code ?**
Les deux. La racine du depot est directement ouvrable comme Vault Obsidian (dossiers 00-24), tout en restant
un projet logiciel standard (Core/, Agents/, MCP/, .github/).

**Ou sont les secrets ?**
Nulle part dans le repo. Voir SECURITY.md et INSTALL.md.

**Comment ajouter un nouvel agent/MCP/routine ?**
Suivre le squelette d'un module existant du meme type, mettre a jour AGENTS.md/MCP.md/ROUTINES.md en
consequence.
