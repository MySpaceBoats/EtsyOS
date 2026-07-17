# Obsidian — EtsyOS

Ce depot est directement utilisable comme Vault Obsidian : ouvrir la racine du depot dans Obsidian.

## Structure de navigation (00-24)

| Dossier | Role |
|---|---|
| `00-Dashboard` | Cockpit quotidien du systeme — vue d'ensemble de l'etat d'EtsyOS. Agrege les autres dossiers, n'est jamais une source de verite. |
| `01-Architecture` | Documentation de l'architecture technique et cognitive du systeme. Voir ARCHITECTURE.md a la racine. |
| `02-Documentation` | Documentation generale d'usage et de reference. |
| `03-Roadmap` | Feuille de route et priorites de developpement. Voir ROADMAP.md a la racine. |
| `04-Agents` | Index des agents specialises — renvoie vers /Agents pour le contenu reel. |
| `05-MCP` | Index des serveurs MCP — renvoie vers /MCP pour le contenu reel. |
| `06-Routines` | Index des routines automatisees — renvoie vers /Routines pour le contenu reel. |
| `07-Knowledge` | Base de connaissances persistante du systeme — renvoie vers /Knowledge pour le contenu reel. |
| `08-Market` | Analyses de marche, niches, opportunites. |
| `09-Products` | Catalogue des produits crees et en developpement — renvoie vers /Products pour le contenu reel. |
| `10-SEO` | Systeme SEO — mots-cles, titres, descriptions, scores — renvoie vers /MCP/seo. |
| `11-Design` | Assets visuels, mockups, direction artistique. |
| `12-Analytics` | Metriques de performance et tableaux de bord analytiques. |
| `13-Learning` | Apprentissages, ajustements de strategie, historique d'optimisation. |
| `14-Experiments` | Tests A/B et framework d'experimentation. |
| `15-Reports` | Rapports generes (quotidien, hebdomadaire, mensuel, annuel) — renvoie vers /Reports. |
| `16-Daily` | Notes quotidiennes du systeme. |
| `17-Decisions` | Historique des decisions prises par le systeme et par Reda. |
| `18-Assets` | Bibliotheque des assets bruts et finaux — renvoie vers /Assets. |
| `19-Templates` | Templates Markdown pour tous les objets du systeme — renvoie vers /Templates. |
| `20-SOP` | Procedures operationnelles standard. |
| `21-Ideas` | Idees de produits et de niches en incubation. |
| `22-Research` | Recherches approfondies (marche, concurrents, tendances). |
| `23-Journal` | Journal de bord du systeme et de son evolution. |
| `24-Archive` | Archives des elements obsoletes ou clos. |

## Regle de non-duplication

Les dossiers numerotes (00-24) sont une couche de **navigation et de memoire humaine** — ils renvoient par
wiki-link vers le contenu operationnel reel qui vit dans les dossiers logiciels (`/Agents`, `/MCP`,
`/Routines`, `/Products`, `/Reports`, `/Assets`, `/Templates`). Ne jamais dupliquer un contenu deja present
dans un dossier logiciel a l'interieur d'un dossier numerote.

## Frontmatter standard

```yaml
---
type: module|agent|mcp-server|routine|index|product-category|dashboard|decision|report
layer: <voir chaque dossier>
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active|non-implemente|archived
---
```

## Liens

- Wiki-links `[[Note]]` uniquement, jamais de lien casse
- Dataview reserve aux dashboards (00-Dashboard) une fois le plugin configure
