// Données des graphiques des guides, calculées à partir du catalogue à chaque build (les guides restent à jour sans
// régénérer leur texte). Partagé par GuideChart.astro et par scripts/gen-guides.ts (faits donnés au rédacteur).
import { products, productsByCategory, activeShops, productsByShop } from "./catalog";
import { median } from "./stats";
import { PROVINCES } from "../data/geo";
import { SHOP_FACTS, SHORT_NAME } from "../data/shops-content";

const flower = () => productsByCategory("flower").filter((p) => !["shake", "preroll"].includes(p.subtype));
export function chartData(id: string) {
  switch (id) {
    case "ppg_by_weight": {
      return [1, 3.5, 7, 14, 28, 112, 224, 448].map((g) => {
        const v = flower().flatMap((p) => p.formats.filter((f) => f.grams === g).map((f) => f.ppg));
        return { key: String(g), value: median(v), n: v.length };
      }).filter((r) => r.value && r.n >= 5) as Array<{ key: string; value: number; n: number }>;
    }
    case "count_by_grade":
    case "ppg_by_grade": {
      return ["AA", "AA+", "AAA", "AAA+", "AAAA", "AAAA+", "AAAAA"].map((g) => {
        const l = flower().filter((p) => p.grade === g);
        return { key: g, value: id === "count_by_grade" ? l.length : median(l.map((p) => p.ppg).filter((v): v is number => !!v)), n: l.length };
      }).filter((r) => r.value && r.n >= 3) as Array<{ key: string; value: number; n: number }>;
    }
    case "type_share":
      return (["indica", "hybrid", "sativa"] as const).map((t) => ({ key: t, value: flower().filter((p) => p.strainType === t).length, n: 0 }));
    case "thc_by_type":
      return (["indica", "hybrid", "sativa"] as const).map((t) => { const v = flower().filter((p) => p.strainType === t).map((p) => p.thc?.[1]).filter((x): x is number => !!x); return { key: t, value: median(v) ?? 0, n: v.length }; });
    case "ppg_by_type":
      return (["indica", "hybrid", "sativa"] as const).map((t) => { const v = flower().filter((p) => p.strainType === t).map((p) => p.ppg).filter((x): x is number => !!x); return { key: t, value: median(v) ?? 0, n: v.length }; });
    case "per10mg_by_subtype": {
      const l = productsByCategory("edible").filter((p) => p.mgTotal && p.mgTotal >= 10);
      const subs = [...new Set(l.map((p) => p.subtype))];
      return subs.map((s) => { const v = l.filter((p) => p.subtype === s).map((p) => Math.round(p.from / (p.mgTotal! / 10))); return { key: s, value: median(v) ?? 0, n: v.length }; })
        .filter((r) => r.n >= 3).sort((a, b) => a.value - b.value);
    }
    case "seed_price_by_subtype": {
      const l = productsByCategory("seed");
      return [...new Set(l.map((p) => p.subtype))].map((s) => { const v = l.filter((p) => p.subtype === s).map((p) => p.from); return { key: s, value: median(v) ?? 0, n: v.length }; })
        .filter((r) => r.n >= 3).sort((a, b) => a.value - b.value);
    }
    case "free_shipping_by_shop":
      return activeShops.map((s) => { const m = SHOP_FACTS[s.slug]?.freeShipping?.en.match(/\$(\d+)/); return { key: s.slug, label: SHORT_NAME[s.slug] ?? s.name, value: m ? Number(m[1]) * 100 : 0, n: productsByShop(s.slug).length }; })
        .filter((r) => r.value).sort((a, b) => a.value - b.value);
    default:
      return [];
  }
}
export const provinceRows = () => PROVINCES.map((p) => ({ code: p.code, name: p.name, nameFr: p.nameFr, age: p.age, homeGrow: p.homeGrow, retailer: p.retailer, retailerFr: p.retailerFr, publicUse: p.publicUse, publicUseFr: p.publicUseFr }));
export const paymentRows = () => activeShops.map((s) => ({ slug: s.slug, name: SHORT_NAME[s.slug] ?? s.name, payment: SHOP_FACTS[s.slug]?.payment ?? null, shipping: SHOP_FACTS[s.slug]?.shipping ?? null, freeShipping: SHOP_FACTS[s.slug]?.freeShipping ?? null })).filter((r) => r.payment || r.shipping);
export const catalogueSize = () => ({ products: products.length, shops: activeShops.length });
