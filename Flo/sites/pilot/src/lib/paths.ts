// getStaticPaths partagés par les routes EN et FR.
import { CATEGORY_SLUGS, CATEGORY_ORDER, type Lang } from "./i18n";
import { products, productsByCategory, activeShops, strains } from "./catalog";
import { PROVINCES, cities, provSlug, provinceOf } from "./geo";

export const PAGE_SIZE = 48;

export function categoryPaths(lang: Lang, paged: boolean) {
  return CATEGORY_ORDER.flatMap((cat) => {
    const n = Math.ceil(productsByCategory(cat).length / PAGE_SIZE);
    if (!n) return [];
    if (!paged) return [{ params: { cat: CATEGORY_SLUGS[cat][lang] }, props: { cat } }];
    return Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ params: { cat: CATEGORY_SLUGS[cat][lang], n: String(i + 2) }, props: { cat, page: i + 2 } }));
  });
}

// BB_SAMPLE=n : ne construit que n fiches par catégorie (aperçu local rapide), jamais en production
const SAMPLE = Number(process.env.BB_SAMPLE ?? 0);
const sampled = SAMPLE ? CATEGORY_ORDER.flatMap((c) => productsByCategory(c).slice(0, SAMPLE)) : products;
export const productPaths = (_lang: Lang) => sampled.map((p) => ({ params: { slug: p.slug }, props: { slug: p.slug } }));

export const provincePaths = (lang: Lang) => PROVINCES.map((p) => ({ params: { prov: provSlug(p, lang) }, props: { code: p.code } }));

export const cityPaths = (lang: Lang) =>
  cities.map((c) => ({ params: { prov: provSlug(provinceOf(c.province), lang), city: c.slug }, props: { cityKey: `${c.province}/${c.slug}` } }));

export const shopPaths = (_lang: Lang) => activeShops.map((s) => ({ params: { shop: s.slug }, props: { shop: s.slug } }));

export const strainPaths = () => (SAMPLE ? strains.slice(0, SAMPLE * 3) : strains).map((st) => ({ params: { strain: st.slug }, props: { slug: st.slug } }));

import { COLLECTIONS } from "../data/collections";
export const collectionPaths = (lang: Lang) => COLLECTIONS.filter((c) => products.filter(c.filter).length >= (c.min ?? 6)).map((c) => ({ params: { slug: c.slug[lang] }, props: { key: c.key } }));
import { GUIDES } from "../data/guides";
import { guideContent } from "./content";
export const guidePaths = (lang: Lang) => GUIDES.filter((g) => guideContent(g.key, lang)).map((g) => ({ params: { slug: g.slug[lang] }, props: { key: g.key } }));
