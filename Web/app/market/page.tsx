import { SectionPage } from "@/components/control/section-page";
import { Meter, StatCard } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function MarketPage() {
  return (
    <SectionPage
      title="Market Analysis"
      description="Concurrence, demande, fourchette de prix, volumes et saisonnalité estimés par l'étape market-analysis pour chaque produit."
      section="market"
      render={(_p, m) => (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Prix médian" value={`${m.priceMedian}€`} hint={`fourchette ${m.priceLow}–${m.priceHigh}€`} />
            <StatCard label="Volume mensuel estimé" value={m.monthlyVolumeEstimate} hint="ventes potentielles" />
            <StatCard label="Saisonnalité" value={<span className="text-base">{m.seasonality}</span>} />
            <StatCard label="Source" value={<span className="text-base font-mono">{m.meta.source}</span>} />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">Demande</span>
              <Meter value={m.demand} />
            </div>
            <div className="grid grid-cols-[8rem_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">Concurrence</span>
              <Meter value={m.competition} />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{m.notes}</p>
        </>
      )}
    />
  );
}
