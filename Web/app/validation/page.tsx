import { getAllListings } from "@/lib/data";
import { getWorkflows } from "@/lib/state";
import { DashboardClient } from "@/components/dashboard-client";
import { PageHeader } from "@/components/control/primitives";
import Link from "next/link";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// La console de validation historique, intégrée comme l'étape `validation` du
// Workflow Engine : chaque décision (Approve/Reject/…) écrit le frontmatter de
// la fiche, et le moteur — qui est en pause sur ce gate — la lit à la reprise.
// La frontière de sécurité est inchangée : aucun appel Etsy/Printify/MCP ici.
export default async function ValidationPage() {
  const [listings, workflows] = await Promise.all([getAllListings(), getWorkflows()]);
  const paused = workflows.filter((w) => w.status === "paused");

  return (
    <>
      <PageHeader
        title="Validation"
        description="Le point de contrôle humain — étape `validation` de la pipeline. Approuver ou refuser écrit la décision dans la fiche produit ; le workflow en pause reprend ensuite (page Workflows → Reprendre)."
        actions={
          paused.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {paused.length} workflow(s) en attente :{" "}
              {paused.map((w, i) => (
                <span key={w.id}>
                  {i > 0 ? ", " : ""}
                  <Link href={`/workflows/${w.id}`} className="font-mono text-xs hover:underline">
                    {w.id}
                  </Link>
                </span>
              ))}
            </p>
          ) : undefined
        }
      />
      <DashboardClient listings={listings.map((l) => l.data)} />
    </>
  );
}
