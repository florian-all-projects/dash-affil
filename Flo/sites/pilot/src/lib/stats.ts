// Petits calculs partagés par les modules chiffrés des pages (médianes, regroupements).
import type { Product } from "./catalog";

export const median = (v: number[]) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
/** Médiane d'une mesure par groupe (ex. prix au gramme par boutique), groupes de taille ≥ min, triés du plus bas au plus haut. */
export function medianBy(list: Product[], key: (p: Product) => string[] | string | null, val: (p: Product) => number | null, min = 5) {
  const g = new Map<string, number[]>();
  for (const p of list) {
    const v = val(p);
    if (v === null || !(v > 0)) continue;
    const ks = key(p);
    for (const k of Array.isArray(ks) ? ks : ks ? [ks] : []) (g.get(k) ?? g.set(k, []).get(k)!).push(v);
  }
  return [...g.entries()].filter(([, v]) => v.length >= min).map(([k, v]) => ({ key: k, value: median(v)!, n: v.length })).sort((a, b) => a.value - b.value);
}
/** Prix au gramme médian par format de poids (3,5 g, 7 g, 14 g, 28 g…) : montre l'économie du vrac. */
export function ppgByFormat(list: Product[], formats = [1, 3.5, 7, 14, 28, 56, 112, 224, 448], min = 5) {
  return formats.map((g) => {
    const v = list.flatMap((p) => p.formats.filter((f) => f.grams === g).map((f) => f.ppg));
    return { grams: g, value: median(v), n: v.length };
  }).filter((r) => r.value !== null && r.n >= min) as Array<{ grams: number; value: number; n: number }>;
}
export const shopsOf = (p: Product) => [...new Set(p.offers.map((o) => o.shop.slug))];
