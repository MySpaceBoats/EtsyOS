import { PageHeader, SimpleTable, StatusBadge } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Registre des serveurs MCP du dépôt (MCP/*). Statuts reflétant la ROADMAP :
// « implémenté » = code réel testé ; « vendored » = serveur tiers embarqué ;
// « squelette » = interface documentée, pas de code. La disponibilité runtime
// (ping, temps de réponse, dernière utilisation) sera consignée par le moteur
// dans Core/state quand les steps invoqueront réellement les MCP — l'Event
// Bus la publiera alors ici sans changer cette page.
const MCP_REGISTRY = [
  { name: "etsy", role: "Auth OAuth2 PKCE + 50 outils Etsy (vendored)", status: "implémenté", phase: 1 },
  { name: "printify", role: "Publication POD via @tsavo/printify-mcp", status: "vendored", phase: 1 },
  { name: "storage", role: "Client Cloudflare R2 (upload/download/list/sign)", status: "implémenté", phase: 1 },
  { name: "image-generation", role: "Génération multi-providers avec bascule (Workers AI → Imagen → HF)", status: "implémenté", phase: 1 },
  { name: "assets", role: "Écriture des fiches assets dans le Vault", status: "implémenté", phase: 1 },
  { name: "higgsfield", role: "Génération image/vidéo hosted — auth headless à résoudre", status: "bloqué", phase: 3 },
  { name: "market", role: "Données marché Etsy", status: "squelette", phase: 2 },
  { name: "competitor", role: "Veille concurrence", status: "squelette", phase: 2 },
  { name: "knowledge", role: "Mémoire persistante partagée", status: "squelette", phase: 2 },
  { name: "seo", role: "Scores et générateurs SEO (remplacera l'heuristique du step seo-generator)", status: "squelette", phase: 3 },
  { name: "publishing", role: "Gate d'écriture pour la publication réelle", status: "squelette", phase: 4 },
  { name: "quality", role: "Contrôles qualité avancés (remplacera l'heuristique du step quality-assurance)", status: "squelette", phase: 4 },
  { name: "analytics", role: "Métriques de vente Etsy", status: "squelette", phase: 5 },
  { name: "pricing", role: "Stratégie prix", status: "squelette", phase: 5 },
  { name: "experiments", role: "A/B tests", status: "squelette", phase: 5 },
  { name: "notifications", role: "Alertes", status: "squelette", phase: 6 },
];

const STATUS_BADGE: Record<string, string> = {
  implémenté: "completed",
  vendored: "running",
  bloqué: "failed",
  squelette: "pending",
};

export default function McpPage() {
  return (
    <>
      <PageHeader
        title="MCP"
        description="Les serveurs MCP sont la seule couche autorisée à parler à l'extérieur. Le Workflow Engine les consomme comme providers de ses étapes — jamais en direct depuis la console. Disponibilité/latence runtime seront publiées dans Core/state quand les steps les invoqueront en live."
      />
      <SimpleTable
        head={["Serveur", "Rôle", "Statut", "Phase ROADMAP", "Docs"]}
        rows={MCP_REGISTRY.map((m) => [
          <span key="n" className="font-mono text-sm">{m.name}</span>,
          m.role,
          <StatusBadge key="s" status={STATUS_BADGE[m.status]} />,
          `Phase ${m.phase}`,
          <a
            key="d"
            href={`https://github.com/MySpaceBoats/EtsyOS/tree/main/MCP/${m.name}`}
            className="text-xs text-muted-foreground hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            MCP/{m.name}
          </a>,
        ])}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Légende : <StatusBadge status="completed" /> implémenté et testé · <StatusBadge status="running" /> serveur tiers
        embarqué · <StatusBadge status="failed" /> bloqué (voir README du serveur) · <StatusBadge status="pending" /> squelette documenté.
      </p>
    </>
  );
}
