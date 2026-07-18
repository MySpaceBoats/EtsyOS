import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getWorkflow } from "@/lib/state";
import { PageHeader, StatCard, StatusBadge, JsonInspector, fmtDate, fmtMs } from "@/components/control/primitives";
import { WorkflowGraph } from "@/components/control/workflow-graph";
import { RequeueButton } from "./requeue-button";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  if (!workflow) notFound();
  const product = await getProduct(workflow.productId);

  const total = workflow.steps.reduce((s, st) => s + (st.durationMs ?? 0), 0);
  const canRequeue = workflow.status === "paused" || workflow.status === "failed";

  return (
    <>
      <PageHeader
        title={workflow.id}
        description={workflow.pausedReason ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {workflow.dryRun ? (
              <span className="rounded border px-2 py-1 text-xs text-muted-foreground">DRY-RUN</span>
            ) : null}
            <StatusBadge status={workflow.status} />
            {canRequeue ? (
              <RequeueButton
                workflowId={workflow.id}
                kind={workflow.status === "failed" ? "retry-step" : "resume-workflow"}
              />
            ) : null}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Produit"
          value={
            product ? (
              <Link href={`/products/${product.slug}`} className="text-base hover:underline">
                {product.title}
              </Link>
            ) : (
              workflow.productId
            )
          }
          hint={workflow.productId}
        />
        <StatCard label="Durée totale" value={fmtMs(total)} />
        <StatCard label="Créé" value={<span className="text-base">{fmtDate(workflow.createdAt)}</span>} />
        <StatCard label="Mis à jour" value={<span className="text-base">{fmtDate(workflow.updatedAt)}</span>} />
      </div>

      <section className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold">Pipeline</h2>
        <WorkflowGraph workflow={workflow} />
      </section>

      <div className="mt-6 space-y-3">
        <JsonInspector label="État brut du workflow (Core/state/workflows)" value={workflow} />
        {product ? <JsonInspector label="Product Object (Core/state/products)" value={product} /> : null}
      </div>
    </>
  );
}
