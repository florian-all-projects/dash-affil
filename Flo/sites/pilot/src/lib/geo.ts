// Géographie du site : provinces (faits légaux, src/data/geo.ts) + villes et boutiques physiques autorisées
// (registres officiels des provinces, export src/data/generated/stores.json). Une ville a une page si elle a
// assez de boutiques autorisées pour une page utile, ou si c'est une grande ville / une capitale (liste CITIES).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PROVINCES, CITIES, provinceOf, LEGAL_SOURCE, type Province } from "../data/geo";
import type { Lang } from "./i18n";

export { PROVINCES, provinceOf, LEGAL_SOURCE, type Province };

export interface Store {
  province: string; citySlug: string; cityName: string; cityNameFr: string | null; name: string; address: string; postal: string | null;
  phone: string | null; website: string | null; lat: number | null; lon: number | null; source: string; sourceUrl: string;
}
export interface CityInfo { slug: string; name: string; nameFr: string; province: string; stores: Store[]; big: boolean }

export const MIN_STORES_FOR_PAGE = 3;
/** Provinces dont le registre des magasins n'a pas pu être chargé (NSLC et Cannabis NB bloquent les robots) ; NU n'a pas de magasin physique. */
export const NO_REGISTRY = new Set(["NS", "NB"]);

const storesPath = join(process.cwd(), "src", "data", "generated", "stores.json");
export const stores: Store[] = existsSync(storesPath) ? JSON.parse(readFileSync(storesPath, "utf8")) : [];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const byKey = new Map<string, CityInfo>();
const key = (prov: string, slug: string) => `${prov}/${slug}`;
for (const c of CITIES) byKey.set(key(c.province, c.slug), { ...c, stores: [], big: true });
// Les villes viennent de D1 (table cities) : slug unique par province, fusions municipales déjà faites (Flo/stores/load_stores.py)
for (const st of stores) {
  const k = key(st.province, st.citySlug);
  let c = byKey.get(k);
  if (!c) {
    c = { slug: st.citySlug, name: st.cityName, nameFr: st.cityNameFr ?? st.cityName, province: st.province, stores: [], big: false };
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

/** Centre approximatif d'une ville : moyenne des coordonnées de ses magasins (registres officiels). */
const centre = (c: CityInfo) => {
  const pts = c.stores.filter((s) => s.lat && s.lon);
  return pts.length ? { lat: pts.reduce((a, s) => a + s.lat!, 0) / pts.length, lon: pts.reduce((a, s) => a + s.lon!, 0) / pts.length } : null;
};
const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
/** Villes voisines : les plus proches à vol d'oiseau quand on connaît les coordonnées, sinon les plus fournies de la province. */
export const nearby = (c: CityInfo, n = 8) => {
  const others = citiesOf(c.province).filter((x) => x.slug !== c.slug);
  const here = centre(c);
  if (!here) return others.slice(0, n);
  const withD = others.map((x) => ({ x, d: centre(x) })).filter((y) => y.d).map((y) => ({ x: y.x, km: km(here, y.d!) }));
  return withD.length >= 3 ? withD.sort((a, b) => a.km - b.km).slice(0, n).map((y) => y.x) : others.slice(0, n);
};
