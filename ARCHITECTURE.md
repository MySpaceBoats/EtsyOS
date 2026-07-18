# Architecture — EtsyOS

## Principe directeur

Claude Code est l'unique orchestrateur. Le **Workflow Engine** (`Core/engine`) est le seul chemin d'execution
de la logique produit : toute fonctionnalite (Trend Discovery, Market Analysis, Opportunity Scoring, Product
Planner, Product/Image/Mockup/SEO Generator, Quality Assurance, Validation, Publishing) est une **etape** du
moteur, jamais un agent ou un service isole. GitHub Actions declenche les routines sur des cadences fixes ;
une routine ne fait qu'invoquer le moteur (directement ou via la Task Queue). Les etapes du moteur appellent
des serveurs MCP pour toute integration externe (Etsy, Printify, generation d'images, stockage). Aucune
logique n'est deleguee a un orchestrateur tiers.

**Contrainte de coherence** : aucun nouveau composant (MCP, Agent, Routine, Page, Service) ne s'introduit sans
s'integrer explicitement au Workflow Engine et au Product Object. Un agent qui n'est pas une etape enregistree
du moteur, ou une page qui n'affiche pas un Product Object / un etat du moteur, n'a pas sa place ici.

## Flux general

```
GitHub Actions (cron) / Web (requete humaine)
      -> Task Queue (Core/state/queue) — intentions : run-pipeline, resume-workflow, retry-step
            -> Workflow Engine (Core/engine) — orchestre les 11 etapes de la pipeline
                  -> Etape (Trend, Market, Score, Planner, Generator, Images, Mockups, SEO, QA,
                     Validation, Publishing) — lit/ecrit UNE section du Product Object
                        -> Serveur(s) MCP (execution, integration externe)
                              -> Etsy / Printify / Higgsfield / R2 / ...
      -> State Manager (Core/state) — Product Objects + etat des workflows, resumable
      -> Event Bus (Core/state/events) — chaque transition emet un evenement
            -> Web (EtsyOS Control Center) — lit Core/state via la GitHub Contents API, aucune
               connexion directe au moteur
      -> Vault Obsidian (memoire humaine long terme, decisions)
```

## Couches

1. **Core** — configuration centrale ; **`Core/engine`** est le Workflow Engine lui-meme (Product Object,
   State Manager, Event Bus, Task Queue, les 11 etapes, CLI) ; **`Core/state`** est son etat persiste,
   committe au depot pour etre lisible par le Control Center.
2. **Agents** — raisonnement specialise, encore au stade squelette. Quand un agent est implemente, son
   raisonnement est appele **depuis une etape du moteur** (jamais declenche independamment) — voir AGENTS.md.
3. **MCP** — la seule couche autorisee a parler a l'exterieur (API Etsy, API Printify, generation d'image,
   stockage S3). Une etape du moteur n'appelle jamais une API externe directement, seulement un MCP.
4. **Routines** — sequences documentees d'appels au moteur (via la Task Queue), declenchees par GitHub
   Actions, avec logs et recuperation apres erreur (le State Manager rend chaque workflow reprenable).
5. **Vault Obsidian (00-24)** — couche de visibilite humaine et de memoire long terme lisible par Reda. Ne
   duplique jamais le contenu operationnel (Products/, MCP/, Agents/, Core/state) — y renvoie via wiki-links.
6. **Web — EtsyOS Control Center** — application Next.js (Cloudflare Pages), interface graphique officielle
   d'EtsyOS. Deux roles distincts et non negociables :
   - **Observabilite** : toutes les pages (Dashboard, Workflows, Trend Discovery, Market Analysis,
     Opportunity Scoring, Product Planner/Generator, Image/Mockup Generator, SEO Generator, Quality
     Assurance, Analytics, Learning, Assets, MCP, Logs, Configuration) lisent `Core/state/**` (Product
     Objects, workflows, evenements, file d'attente) via la GitHub Contents API — jamais de connexion
     directe au moteur, jamais de logique dupliquee.
   - **Validation humaine** (page `/validation`, ex-console) : point de controle **integre comme l'etape
     `validation` du moteur**. Ecrit uniquement des demandes de changement d'etat dans le frontmatter des
     fiches `Products/<Categorie>/Listings/<slug>.md`. Le bouton "Reprendre"/"Relancer" (pages
     Workflows/Validation) ecrit une intention dans `Core/state/queue/tasks.json` — jamais d'appel Etsy,
     Printify ni MCP direct, jamais de depense depuis un clic. Une Routine (ou Claude Code) execute la
     reprise reelle. Voir Web/README.md.

## Le Product Object

Structure unique qui circule dans toute la pipeline (`Core/engine/src/product-object.ts`). Chaque etape lit
les sections ecrites par les etapes precedentes et ecrit exactement UNE section (`trend`, `market`,
`opportunity`, `plan`, `generation`, `images`, `mockups`, `seo`, `qa`, `validation`, `publication`). Chaque
section porte sa source (`offline-heuristic` | `mcp-*` | `human`) — rien ne peut se faire passer pour une
donnee de marche reelle. Le Product Object est l'unique vocabulaire partage entre le moteur, la Task Queue,
l'Event Bus et le Control Center.

## Le Workflow Engine

- **State Manager** (`Core/engine/src/state.ts`) — persistance JSON resumable sous `Core/state/` (products,
  workflows, index agrege). Ecriture atomique (write-then-rename) : un processus interrompu ne laisse jamais
  un etat corrompu, garantissant la reprise.
- **Event Bus** (`events.ts`) — chaque transition (demarrage, etape terminee, pause, echec) est publiee aux
  abonnes in-process et ajoutee a un journal NDJSON (`Core/state/events/`) que le Control Center rejoue.
- **Task Queue** (`queue.ts`) — file FIFO fichier (`Core/state/queue/tasks.json`) avec tentatives/echec/mort ;
  seul point d'entree pour demarrer, reprendre ou relancer un workflow depuis une routine ou depuis le Web.
- **Moteur** (`engine.ts`) — execute les 11 etapes dans l'ordre, persiste avant/apres chacune, s'arrete
  proprement sur une pause (gate de validation humaine) ou un echec, et reprend exactement ou il s'est arrete.
- **Mode Dry Run** — chaque workflow porte un flag `dryRun`. En dry-run, l'etape `publishing` simule la
  publication (rien ne quitte la machine) tout en traversant l'integralite de la pipeline ; c'est le mode par
  defaut tant que le gate d'ecriture MCP (Phase 4) n'existe pas.
- **Gate de publication** — l'etape `publishing` re-verifie elle-meme `qa.passed` ET `validation.approved`
  avant tout envoi, independamment de ce que les etapes precedentes rapportent. Aucun chemin ne permet de
  publier sans etre passe par la QA et par un humain.

## Stockage

- **Cloudflare R2** (compatible S3) pour les assets binaires (images, mockups, exports) — source unique de
  verite, planifiee par les etapes `image-generator`/`mockup-generator` du moteur, ecrite par le MCP `storage`.
- **`Core/state/`** (JSON) pour l'etat de la pipeline — committe au depot, lu par le Control Center.
- **Obsidian Markdown** pour toute donnee structurable en connaissance (decisions, rapports, historique).
- Aucun secret dans le Vault ni dans `Core/state` — voir SECURITY.md.

## Modules

Voir MCP.md, AGENTS.md, ROUTINES.md pour le detail contractuel de chaque module, et
`Core/engine/README.md` pour le detail du Workflow Engine.

## Statut

Workflow Engine operationnel (11 etapes, dry-run, gate humain, tests). Web devenu EtsyOS Control Center. Voir
ROADMAP.md pour les prochaines implementations (providers MCP live remplaçant les heuristiques offline).
