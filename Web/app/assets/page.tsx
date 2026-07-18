import { getProducts } from "@/lib/state";
import { PageHeader, SimpleTable, EmptyState } from "@/components/control/primitives";
import Link from "next/link";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Assets : l'inventaire R2 vu depuis les Product Objects — la pipeline étant
// la seule écriture vers R2, l'union des sections images/mockups EST le
// manifeste de ce que le bucket doit contenir. Le browsing R2 direct (listing
// du bucket, aperçus, téléchargement) nécessite les credentials R2 en secret
// Pages ; tant qu'ils ne sont pas configurés, cette page montre le manifeste
// et marque chaque clé planifiée vs générée.
export default async function AssetsPage() {
  const products = await getProducts();
  const rows = products.flatMap((p) => [
    ...(p.images?.assets ?? []).map((a) => ({
      product: p, key: a.key, kind: `image · ${a.kind}`, detail: `${a.width}×${a.height}`,
      provider: a.provider, simulated: a.simulated,
    })),
    ...(p.mockups?.assets ?? []).map((a) => ({
      product: p, key: a.key, kind: `mockup · ${a.scene}`, detail: a.scene,
      provider: a.provider, simulated: a.simulated,
    })),
  ]);

  return (
    <>
      <PageHeader
        title="Assets (Cloudflare R2)"
        description="Manifeste des assets du bucket R2, dérivé des Product Objects — R2 est la source de vérité des binaires, la pipeline la seule écriture. L'explorateur direct (aperçu, téléchargement, suppression) s'activera quand les credentials R2 seront configurés en secrets Pages."
      />
      {rows.length === 0 ? (
        <EmptyState title="Aucun asset" detail="La pipeline n'a encore planifié aucun asset." />
      ) : (
        <SimpleTable
          head={["Clé R2", "Type", "Produit", "Provider", "État"]}
          rows={rows.map((r) => [
            <span key="k" className="font-mono text-xs">{r.key}</span>,
            r.kind,
            <Link key="p" href={`/products/${r.product.slug}`} className="hover:underline">{r.product.title}</Link>,
            <span key="pr" className="font-mono text-xs text-muted-foreground">{r.provider}</span>,
            r.simulated ? (
              <span key="s" className="text-xs text-amber-700 dark:text-amber-300">planifié</span>
            ) : (
              <span key="s" className="text-xs text-emerald-700 dark:text-emerald-300">dans R2</span>
            ),
          ])}
        />
      )}
    </>
  );
}
