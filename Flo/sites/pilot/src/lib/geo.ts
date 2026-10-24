// Géographie du site : provinces (faits légaux, src/data/geo.ts) + villes et boutiques physiques autorisées
// (registres officiels des provinces, export src/data/generated/stores.json). Une ville a une page si elle a
// assez de boutiques autorisées pour une page utile, ou si c'est une grande ville / une capitale (liste CITIES).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PROVINCES, CITIES, provinceOf, LEGAL_SOURCE, type Province } from "../data/geo";
import type { Lang } from "./i18n";

export { PROVINCES, provinceOf, LEGAL_SOURCE, type Province };

export interface Store {
  province: string; city: string; name: string; address: string; postal: string | null; phone: string | null;
  website: string | null; lat: number | null; lon: number | null; source: string; sourceUrl: string;
}
export interface CityInfo { slug: string; name: string; nameFr: string; province: string; stores: Store[]; big: boolean }

export const MIN_STORES_FOR_PAGE = 3;

const storesPath = join(process.cwd(), "src", "data", "generated", "stores.json");
export const stores: Store[] = existsSync(storesPath) ? JSON.parse(readFileSync(storesPath, "utf8")) : [];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Noms français des villes dont l'orthographe change (le reste est identique dans les deux langues)
const FR_NAMES: Record<string, string> = { montreal: "Montréal", "quebec-city": "Québec", "trois-rivieres": "Trois-Rivières" };
const EN_NAMES: Record<string, string> = { montreal: "Montreal", "quebec-city": "Quebec City", "trois-rivieres": "Trois-Rivières" };

const byKey = new Map<string, CityInfo>();
const key = (prov: string, slug: string) => `${prov}/${slug}`;
for (const c of CITIES) byKey.set(key(c.province, c.slug), { ...c, stores: [], big: true });
for (const st of stores) {
  // « Québec » (ville) devient quebec-city pour ne pas se confondre avec la province
  let slug = slugify(st.city);
  if (st.province === "QC" && slug === "quebec") slug = "quebec-city";
  const k = key(st.province, slug);
  let c = byKey.get(k);
  if (!c) {
    c = { slug, name: EN_NAMES[slug] ?? st.city, nameFr: FR_NAMES[slug] ?? st.city, province: st.province, stores: [], big: false };
    byKey.set(k, c);
  }
  c.stores.push(st);
}
for (const c of byKey.values()) c.stores.sort((a, b) => a.name.localeCompare(b.name));

/** Villes qui ont une page, triées par nombre de boutiques puis par nom. */
export const cities: CityInfo[] = [...byKey.values()]
  .filter((c) => c.big || c.stores.length >= MIN_STORES_FOR_PAGE)
  .sort((a, b) => Number(b.big) - Number(a.big) || b.stores.length - a.stores.length || a.name.localeCompare(b.name));

export const citiesOf = (prov: string) => cities.filter((c) => c.province === prov);
export const storesOf = (prov: string) => stores.filter((s) => s.province === prov);
export const cityName = (c: CityInfo, l: Lang) => (l === "en" ? c.name : c.nameFr);
export const provName = (p: Province, l: Lang) => (l === "en" ? p.name : p.nameFr);
export const provSlug = (p: Province, l: Lang) => (l === "en" ? p.slug : p.slugFr);

/** Villes voisines : même province, les plus fournies d'abord. */
export const nearby = (c: CityInfo, n = 8) => citiesOf(c.province).filter((x) => x.slug !== c.slug).slice(0, n);
