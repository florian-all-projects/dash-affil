// Listes partagées entre une page et son fichier de données pour le moteur de filtres (/data/*.json).
import { products, activeShops, exportedAt } from "./catalog";

const H = 3600e3;
const ts = (d: string) => Date.parse(d);
export const dealsSet = () => products.filter((p) => p.discount >= 5).sort((a, b) => b.discount - a.discount);

export function newArrivals() {
  const launch = Math.min(...products.map((p) => ts(p.firstSeen)));
  const shopFirst = new Map<string, number>();
  for (const p of products) for (const o of p.offers) shopFirst.set(o.shop.slug, Math.min(shopFirst.get(o.shop.slug) ?? Infinity, ts(p.firstSeen)));
  const newShops = activeShops.filter((x) => (shopFirst.get(x.slug) ?? 0) > launch + 12 * H)
    .map((x) => ({ x, list: products.filter((p) => p.offers.some((o) => o.shop.slug === x.slug)), at: shopFirst.get(x.slug)! }));
  const fresh = products.filter((p) => p.offers.some((o) => ts(p.firstSeen) > (shopFirst.get(o.shop.slug) ?? 0) + 36 * H) && ts(p.firstSeen) > ts(exportedAt) - 21 * 24 * H);
  const list = fresh.length >= 8 ? fresh : [...new Set(newShops.flatMap((n) => n.list))];
  return { newShops, fresh, list };
}
