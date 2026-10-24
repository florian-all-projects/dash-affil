// Profil agrégé d'une variété à partir de tous les produits qui la citent (fleurs, graines, concentrés, vapoteuses).
import { strains, type Product } from "./catalog";
import { median } from "./stats";

export type Strain = (typeof strains)[number];
const norm = (x: string) => x.toLowerCase().replace(/[^a-zà-ÿ ]+/g, " ").replace(/\s+/g, " ").trim();
function tally(list: Product[], get: (p: Product) => string[] | null | undefined, n = 8) {
  const m = new Map<string, { label: string; n: number }>();
  for (const p of list) for (const raw of new Set((get(p) ?? []).map((x) => x.trim()).filter(Boolean))) {
    const k = norm(raw);
    if (!k || k.length > 28) continue;
    const e = m.get(k) ?? { label: raw.toLowerCase(), n: 0 };
    e.n++;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.n - a.n).slice(0, n);
}

const cache = new Map<string, ReturnType<typeof build>>();
export const strainProfile = (st: Strain) => cache.get(st.key) ?? cache.set(st.key, build(st)).get(st.key)!;
function build(st: Strain) {
  const list = st.products;
  const types = { indica: 0, sativa: 0, hybrid: 0 } as Record<string, number>;
  for (const p of list) if (p.strainType) types[p.strainType]++;
  const typed = types.indica + types.sativa + types.hybrid;
  const type = typed ? (Object.entries(types).sort((a, b) => b[1] - a[1])[0][0] as "indica" | "sativa" | "hybrid") : null;
  const lineages = tally(list, (p) => (p.facts?.lineage ? [p.facts.lineage] : null), 3);
  const thcTops = list.map((p) => p.thc?.[1]).filter((v): v is number => !!v);
  const thcLows = list.map((p) => p.thc?.[0]).filter((v): v is number => !!v);
  const ratios = list.map((p) => p.indicaPct).filter((v): v is number => v !== null);
  const cats = new Map<string, number>();
  for (const p of list) cats.set(p.category, (cats.get(p.category) ?? 0) + 1);
  const shopSet = new Set(list.flatMap((p) => p.offers.map((o) => o.shop.slug)));
  const ppgs = list.map((p) => p.ppg).filter((v): v is number => !!v);
  const cheapest = list.reduce((a, b) => (b.from < a.from ? b : a));
  const flowering = list.map((p) => p.facts?.flowering_time).find(Boolean) ?? null;
  return {
    type, types, typed, lineage: lineages[0]?.label ? list.find((p) => p.facts?.lineage && norm(p.facts.lineage) === norm(lineages[0].label))!.facts!.lineage! : null,
    thc: thcTops.length ? [Math.min(...thcLows, ...thcTops), Math.max(...thcTops)] as [number, number] : null,
    indicaPct: ratios.length ? median(ratios) : null,
    flavors: tally(list, (p) => p.facts?.flavors), effects: tally(list, (p) => p.facts?.effects), terpenes: tally(list, (p) => p.facts?.terpenes, 6),
    cats: [...cats.entries()].sort((a, b) => b[1] - a[1]), shops: [...shopSet], from: cheapest.from, cheapest,
    bestPpg: ppgs.length ? Math.min(...ppgs) : null, medPpg: median(ppgs), flowering,
  };
}
