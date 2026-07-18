import { branch } from "@/lib/github";
import { isMockMode } from "@/lib/data";
import { PageHeader, SimpleTable, StatusBadge } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Configuration : quelles variables sont attendues, lesquelles sont présentes
// à l'exécution — valeurs JAMAIS affichées, seulement la présence. Les
// secrets vivent dans Cloudflare Pages (console) et GitHub Actions (moteur),
// jamais dans le dépôt.
const EXPECTED_VARS: { name: string; scope: string; role: string }[] = [
  { name: "GITHUB_TOKEN", scope: "Pages", role: "PAT fine-grained, Contents R/W — la « base de données » de la console" },
  { name: "GITHUB_REPO", scope: "Pages", role: "Dépôt des fiches et de Core/state" },
  { name: "GITHUB_BRANCH", scope: "Pages", role: "Branche lue/écrite" },
  { name: "MOCK_DATA", scope: "Pages (dev/CI)", role: "1 = snapshot embarqué, jamais en prod" },
  { name: "ETSY_CLIENT_ID", scope: "Actions", role: "App Etsy (MCP etsy)" },
  { name: "PRINTIFY_API_TOKEN", scope: "Actions", role: "Token Printify (MCP printify)" },
  { name: "R2_ACCOUNT_ID", scope: "Actions", role: "Compte Cloudflare R2 (MCP storage)" },
  { name: "R2_ACCESS_KEY_ID", scope: "Actions", role: "Clé d'accès R2" },
  { name: "R2_SECRET_ACCESS_KEY", scope: "Actions", role: "Secret R2" },
  { name: "CLOUDFLARE_API_TOKEN", scope: "Actions (deploy)", role: "Déploiement Cloudflare Pages" },
  { name: "CLOUDFLARE_ACCOUNT_ID", scope: "Actions (deploy)", role: "Compte du projet Pages" },
];

export default function ConfigPage() {
  const runtimeChecks: Record<string, boolean> = {
    GITHUB_TOKEN: Boolean(process.env.GITHUB_TOKEN),
    GITHUB_REPO: Boolean(process.env.GITHUB_REPO),
    GITHUB_BRANCH: Boolean(process.env.GITHUB_BRANCH),
    MOCK_DATA: isMockMode(),
  };

  return (
    <>
      <PageHeader
        title="Configuration"
        description="Variables attendues par la console (runtime Pages) et par le moteur (GitHub Actions). Les valeurs ne sont jamais affichées — uniquement la présence côté Pages. Les secrets Actions ne sont pas lisibles depuis ici (et c'est voulu)."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Dépôt :</span>
        <span className="font-mono text-xs">{process.env.GITHUB_REPO || "MySpaceBoats/EtsyOS"}</span>
        <span className="text-muted-foreground">Branche :</span>
        <span className="font-mono text-xs">{branch()}</span>
        <span className="text-muted-foreground">Mode données :</span>
        <StatusBadge status={isMockMode() ? "paused" : "completed"} />
        <span className="text-xs text-muted-foreground">{isMockMode() ? "MOCK (snapshot embarqué)" : "GitHub API (live)"}</span>
      </div>
      <SimpleTable
        head={["Variable", "Portée", "Rôle", "Présence (runtime Pages)"]}
        rows={EXPECTED_VARS.map((v) => [
          <span key="n" className="font-mono text-xs">{v.name}</span>,
          v.scope,
          <span key="r" className="text-xs text-muted-foreground">{v.role}</span>,
          v.name in runtimeChecks ? (
            <StatusBadge key="p" status={runtimeChecks[v.name] ? "completed" : "pending"} />
          ) : (
            <span key="p" className="text-xs text-muted-foreground">non lisible ici</span>
          ),
        ])}
      />
      <section className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <h2 className="mb-1 font-medium text-foreground">Protection de l&apos;application</h2>
        <p>
          L&apos;authentification est assurée par Cloudflare Access (Zero Trust) devant le projet Pages — allowlist
          d&apos;emails dans le dashboard Cloudflare, zéro code applicatif. À configurer après le premier déploiement
          (étape manuelle, voir DEPLOYMENT.md).
        </p>
      </section>
    </>
  );
}
