import { SectionPage } from "@/components/control/section-page";
import { StatusBadge } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PRIORITY_LABEL: Record<string, string> = { high: "haute", medium: "moyenne", low: "basse" };

export default function PlannerPage() {
  return (
    <SectionPage
      title="Product Planner"
      description="Plan de production par produit : type, collection, priorité (dérivée du score d'opportunité), variantes, couleurs et formats."
      section="plan"
      render={(_p, plan) => (
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-1.5">
            <p><span className="text-muted-foreground">Type :</span> {plan.productType}</p>
            <p><span className="text-muted-foreground">Collection :</span> <span className="font-mono text-xs">{plan.collection}</span></p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Priorité :</span>
              <StatusBadge status={plan.priority === "high" ? "completed" : plan.priority === "medium" ? "paused" : "pending"} />
              <span>{PRIORITY_LABEL[plan.priority]}</span>
            </p>
            <p><span className="text-muted-foreground">Formats :</span> {plan.formats.join(", ")}</p>
            <p><span className="text-muted-foreground">Couleurs :</span> {plan.colors.join(", ")}</p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground">Variantes</p>
            <ul className="space-y-1">
              {plan.variants.map((v) => (
                <li key={v.name} className="rounded border px-2 py-1">
                  <span className="font-medium">{v.name}</span>
                  <span className="ml-2 text-muted-foreground">{v.options.join(" · ")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    />
  );
}
