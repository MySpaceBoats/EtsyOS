# Web — Console de validation EtsyOS

Console web (Next.js 15, App Router) où un humain **valide chaque produit généré
par l'IA avant qu'il n'approche Etsy**. C'est le point de contrôle humain
d'EtsyOS : rien ne se publie sans qu'une personne clique un vrai bouton.

Déployée sur **Cloudflare Pages** (runtime Workers). Sœur de `Products/`, `MCP/`,
`Agents/` — pas un dossier Obsidian numéroté (comme `Core/`, `Infrastructure/`,
`Storage/`, `Scripts/`, elle n'a pas d'index numéroté).

---

## ⚠️ Frontière de sécurité — la partie critique

La console **ne fait qu'une seule chose** pour toute action : elle **demande** un
changement d'état en écrivant du frontmatter dans une fiche produit sur GitHub
(via la GitHub Contents API). Elle **n'appelle jamais** l'API Etsy, l'API
Printify, ni aucun serveur MCP, et **ne dépense jamais d'argent** (aucune
génération d'image) depuis un clic de bouton.

Contexte : la ROADMAP d'EtsyOS documente un risque connu et non résolu — `MCP/etsy`
et `MCP/printify` exposent du CRUD complet sans gate d'écriture (Phase 4
`Quality-Agent` pas encore construite). Tant que ce gate n'existe pas, le tier web
public ne doit **jamais** pouvoir déclencher une écriture externe.

Chaque bouton fait la même chose sous le capot : lire la fiche → muter des champs
de frontmatter précis + ajouter une entrée à `history` → committer via la GitHub
API. C'est tout.

| Bouton | Effet frontmatter | Appel externe |
|---|---|---|
| ✅ Valider | `status: Approved` | **aucun** (décision explicite, pas un oubli) |
| 📤 Publier maintenant (activé seulement si `Approved`) | `status: PublishRequested` | **aucun** — stage juste « plus fort » |
| ❌ Refuser | `status: Rejected` (fiche jamais supprimée, history conservée) | aucun |
| 📌 Mettre en attente | `status: OnHold` | aucun |
| 📂 Archiver | `status: Archived` | aucun |
| ⭐ Favori | bascule `favorite` | aucun |
| ✏ Modifier | PUT de la fiche (title/desc/tags/price/variants/colors/categories/materials), `updated` bump + history | aucun |
| 🔄 Régénérer (images/mockups/vidéo/titre/description/tags/tout) | `regeneration_requested: "<type>"` + history | **aucun** — stub |

Une **future Routine** (cron GitHub Actions, hors de cette tâche) scrutera
`status: PublishRequested` et `regeneration_requested: <type>`, et effectuera les
vrais appels Printify/Etsy/génération via les serveurs MCP existants, **à
l'intérieur de l'environnement contrôlé de Claude Code — jamais depuis le tier web
public.**

---

## GitHub comme base de données

Il n'y a **aucun accès filesystem au repo à l'exécution en production** (le bundle
Pages déployé n'a pas `Products/` à côté de lui). Donc :

- **Toutes** les lectures/écritures passent par la GitHub REST Contents API
  (`GET/PUT …/contents/Products/<Category>/Listings/<slug>.md`), via `fetch`
  brut (`lib/github.ts`, ~110 lignes, pas d'`@octokit`). Même chemin de code en
  `next dev` (Node) et sur Pages (Workers) — aucun branchement d'environnement.
- Lectures cachées ~30 s (`next: { revalidate: 30 }`) pour ménager la limite de
  5000 req/h de l'API GitHub. Après une écriture, `revalidatePath()` invalide.
- Une écriture (PUT) nécessite le SHA du blob git courant : la console fait
  fetch-puis-write (pas de résolution de conflit — outil mono-utilisateur).

### Mode mock (dev / CI uniquement)

Si `MOCK_DATA=1` **ou** si `GITHUB_TOKEN` est absent, l'app sert les 6 fiches de
seed depuis `lib/mock.ts` et ne touche pas GitHub — pour lancer/vérifier l'app
sans token. En mock, les écritures ne sont pas persistées (la fiche mutée est
renvoyée pour un affichage optimiste). **Ne jamais activer `MOCK_DATA` en prod.**
Le chemin de production (GitHub API) et le chemin mock partagent exactement le
même code d'affichage ; seule la source des données diffère.

---

## Modèle de données

Une fiche par produit : `Products/<Category>/Listings/<slug>.md`. Le dossier
`Listings/` n'est ajouté que dans les catégories avec seed (Mugs, Shirts,
Wall-Art). Frontmatter YAML — voir `lib/listings.ts` pour le type complet
(`type: product-listing`, `layer: products`, `status`, `slug`, `title_etsy`,
`tags` (≤13), `price`, `variants`, `images` (1re = principale), `history[]`, etc.).

Statuts : `Draft · Approved · PublishRequested · Published · Rejected · OnHold ·
Archived`. `history` conserve chaque transition pour toujours.

---

## Pages

- **`/`** — Dashboard : grille de cartes (image, titre, prix, badge statut,
  catégorie, actions rapides Valider/Refuser/Favori). Recherche instantanée
  (client), filtres (statut, catégorie, boutique, couleur, fournisseur image,
  plage de dates), tri (date/prix/titre), pagination client.
- **`/products/[slug]`** — Validation, deux onglets :
  - **Fiche** : tous les champs, tous les boutons d'action, formulaire d'édition
    inline (modal) qui PUT la fiche sur GitHub, timeline d'historique.
  - **Aperçu Etsy** : composant stylé comme une vraie page produit Etsy (galerie
    + miniatures, titre, prix, sélecteurs de variantes, description, tags), avec
    bascule desktop/mobile (contraint la largeur max).

---

## Auth — aucune dans le code

La protection est **Cloudflare Access (Zero Trust)** devant le projet Pages :
allowlist d'emails configurée dans le dashboard, zéro code applicatif, extensible
en ajoutant des emails à la policy. Pas de login/session/NextAuth dans l'app.
**Access doit être configuré après le déploiement** (étape manuelle dashboard).

---

## Développement local

```bash
cd Web
npm install                 # .npmrc force legacy-peer-deps (conflit next-on-pages/wrangler)
cp .env.example .env.local  # laisser GITHUB_TOKEN vide et MOCK_DATA=1 pour un dev sans token
MOCK_DATA=1 npm run dev     # http://localhost:3000 avec les fiches de seed
```

Avec un vrai token : renseigner `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`
dans `.env.local`, laisser `MOCK_DATA=0`.

### Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de dev |
| `npm run build` | build Next.js standard |
| `npm run pages:build` | build adaptateur Cloudflare (`@cloudflare/next-on-pages`) — **le build qui compte** |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Variables d'environnement (requises)

| Variable | Exemple | Rôle |
|---|---|---|
| `GITHUB_TOKEN` | *(PAT fine-grained)* | PAT GitHub fine-grained, scope **Contents: Read and write** sur le repo EtsyOS. **Pas encore créé.** À définir comme secret Cloudflare Pages (et secret *Preview*). Jamais commité. |
| `GITHUB_REPO` | `MySpaceBoats/EtsyOS` | repo qui stocke les fiches |
| `GITHUB_BRANCH` | `main` | branche lue/écrite |
| `MOCK_DATA` | `0` | `1` = mode mock (dev/CI uniquement), jamais en prod |

---

## Déploiement — Cloudflare Pages

Build adaptateur : `npx @cloudflare/next-on-pages` → sortie `.vercel/output/static`.

**Réglages du projet Pages :**

| Réglage | Valeur |
|---|---|
| Root directory | `Web` |
| Build command | `npx @cloudflare/next-on-pages@1` |
| Build output directory | `.vercel/output/static` |
| Compatibility flags | `nodejs_compat` |
| Env vars (Production + Preview) | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` |

Toutes les Route Handlers / pages dynamiques déclarent `export const runtime =
"edge"` (requis par next-on-pages). Images non optimisées (`images.unoptimized`)
— servies directement par le CDN Cloudflare/R2.

Étapes **manuelles une seule fois** (non scriptées, réalisées par Reda) : création
du projet Pages, intégration git GitHub Actions, configuration de Cloudflare
Access, création du `GITHUB_TOKEN`.
