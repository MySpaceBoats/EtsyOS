import { SectionPage } from "@/components/control/section-page";
import { SimpleTable, StatusBadge } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function QaPage() {
  return (
    <SectionPage
      title="Quality Assurance"
      description="Résultat des contrôles automatiques avant validation humaine : budgets Etsy, résolution print-ready, marques protégées (copyright / politique Etsy), doublons, prix. Un échec QA bloque la publication — le gate est re-vérifié par l'étape publishing elle-même."
      section="qa"
      render={(_p, qa) => (
        <>
          <p className="mb-3 flex items-center gap-2 text-sm">
            <StatusBadge status={qa.passed ? "completed" : "failed"} />
            {qa.passed ? "Tous les contrôles passent" : "Au moins un contrôle échoue — publication bloquée"}
          </p>
          <SimpleTable
            head={["Contrôle", "Résultat", "Détail"]}
            rows={qa.checks.map((c) => [
              c.label,
              <StatusBadge key="s" status={c.passed ? "completed" : "failed"} />,
              <span key="d" className="text-xs text-muted-foreground">{c.detail}</span>,
            ])}
          />
        </>
      )}
    />
  );
}
