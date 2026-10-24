// Modèle de données du site, construit à partir de l'export D1 (src/data/generated/*.json).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import shopsRaw from "../data/generated/shops.json";
import productsRaw from "../data/generated/products.json";
import offersRaw from "../data/generated/offers.json";
import couponsRaw from "../data/generated/coupons.json";
import imagesRaw from "../data/generated/images.json";
import metaRaw from "../data/generated/meta.json";
import type { Lang } from "./i18n";

// Fichiers optionnels (photos des shops, contenus générés) : absents tant que les scripts n'ont pas tourné
function optionalJson<T>(name: string, fallback: T): T {
  // Chemin depuis la racine du projet : import.meta.url pointe vers le bundle de build, pas vers src/
  const p = join(process.cwd(), "src", "data", "generated", name);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : fallback;
}

export interface Shop {
  id: number; slug: string; name: string; domain: string; category: string; platform: string | null;
  affiliate_url: string | null; deeplink_mode: string | null; deeplink_param: string | null; lifetime: number; priority: number;
}
export interface Offer { shop: Shop; url: string; buyUrl: string; price: number; compareAt: number | null }
export interface ProductText {
  meta: string; lead: string; sections: Array<{ h: string; p: string[] }>; faq: Array<{ q: string; a: string }>;
}
export interface ProductFacts {
  thc: string | null; cbd: string | null; lineage: string | null; grade: string | null; brand: string | null;
  effects: string[] | null; flavors: string[] | null; terpenes: string[] | null; flowering_time: string | null; yield: string | null;
}
export interface Product {
  id: number; slug: string; name: string; category: string; strainType: string | null; weights: string[];
  offers: Offer[]; shopCount: number; from: number; primary: Offer; discount: number;
  image: { src: string; kind: "ai" | "shop" | "category"; credit: string | null };
  firstSeen: string; text: { en: ProductText; fr: ProductText } | null; facts: ProductFacts | null;
}
export interface Coupon { code: string; description: string | null; kind: string | null; value: string | null; source: string; verified: number; updated_at: string; shop: string }

export const exportedAt: string = (metaRaw as { exported_at: string }).exported_at;
export const shops: Shop[] = shopsRaw as Shop[];
const shopById = new Map(shops.map((s) => [s.id, s]));

/** Lien « Acheter » : URL produit + identifiant affilié (même logique que le scraper, PLAN §11). */
export function affiliateUrl(productUrl: string, s: Shop): string {
  if (!s.deeplink_mode || !s.deeplink_param || s.deeplink_mode === "landing") return s.affiliate_url ?? productUrl;
  const u = new URL(productUrl);
  if (s.deeplink_mode === "query") {
    const [k, v = ""] = s.deeplink_param.split("=");
    u.searchParams.set(k, v);
    return u.toString();
  }
  u.pathname = (u.pathname.endsWith("/") ? u.pathname : u.pathname + "/") + s.deeplink_param.replace(/^\/+/, "");
  return u.toString();
}

const aiImages = new Map((imagesRaw as Array<{ product_id: number; path: string }>).map((i) => [i.product_id, i.path]));
const shopImages = optionalJson<Record<string, { src: string; shop: number }>>("shop-images.json", {});
const content = optionalJson<Record<string, { facts: ProductFacts; en: ProductText; fr: ProductText }>>("content-products.json", {});

const offersByProduct = new Map<number, Offer[]>();
for (const o of offersRaw as Array<{ product_id: number; shop_id: number; product_url: string; price_cents: number; compare_at_cents: number | null }>) {
  const shop = shopById.get(o.shop_id);
  if (!shop) continue;
  const list = offersByProduct.get(o.product_id) ?? [];
  list.push({ shop, url: o.product_url, buyUrl: affiliateUrl(o.product_url, shop), price: o.price_cents, compareAt: o.compare_at_cents });
  offersByProduct.set(o.product_id, list);
}

export const products: Product[] = (productsRaw as Array<{ id: number; slug: string; name: string; category: string; strain_type: string | null; weight: string | null; first_seen: string }>)
  .map((p) => {
    const offers = (offersByProduct.get(p.id) ?? []).sort((a, b) => a.price - b.price);
    if (!offers.length) return null;
    // Bouton principal (PLAN §5) : vendeur en affiliation à vie s'il y en a un, sinon le moins cher.
    const lifetime = offers.filter((o) => o.shop.lifetime);
    const primary = lifetime[0] ?? offers[0];
    const best = offers[0];
    const discount = best.compareAt && best.compareAt > best.price ? Math.round((1 - best.price / best.compareAt) * 100) : 0;
    // Image : visuel IA si généré, sinon photo du shop (choix de Florian, 24/10), sinon visuel de catégorie
    const ai = aiImages.get(p.id);
    const sh = shopImages[String(p.id)];
    const image = ai
      ? { src: ai, kind: "ai" as const, credit: null }
      : sh
        ? { src: sh.src, kind: "shop" as const, credit: shopById.get(sh.shop)?.name ?? null }
        : { src: `/img/cat/${p.category}.webp`, kind: "category" as const, credit: null };
    const c = content[String(p.id)];
    return {
      id: p.id, slug: p.slug, name: p.name, category: p.category, strainType: p.strain_type,
      weights: (p.weight ?? "").split("|").map((w) => w.trim()).filter(Boolean).slice(0, 10),
      offers, shopCount: new Set(offers.map((o) => o.shop.slug)).size, from: best.price, primary, discount,
      image, firstSeen: p.first_seen, text: c ? { en: c.en, fr: c.fr } : null, facts: c?.facts ?? null,
    } satisfies Product;
  })
  .filter((p): p is Product => p !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

export const productBySlug = new Map(products.map((p) => [p.slug, p]));
export const productsByCategory = (cat: string) => products.filter((p) => p.category === cat);
export const productsByShop = (slug: string) => products.filter((p) => p.offers.some((o) => o.shop.slug === slug));
export const activeShops = shops.filter((s) => products.some((p) => p.offers.some((o) => o.shop.slug === s.slug)));

/** Classement « les plus comparés » : nombre de shops, puis présence d'une image propre, puis prix. */
export const byPopularity = (a: Product, b: Product) =>
  b.shopCount - a.shopCount || (a.image.kind === "category" ? 1 : 0) - (b.image.kind === "category" ? 1 : 0) || a.from - b.from;

export function categoryStats(cat: string) {
  const list = productsByCategory(cat);
  if (!list.length) return null;
  const cheapest = list.reduce((a, b) => (b.from < a.from ? b : a));
  const shopSlugs = new Set(list.flatMap((p) => p.offers.map((o) => o.shop.slug)));
  return { count: list.length, from: cheapest.from, cheapest, shops: shopSlugs.size, shopSlugs: [...shopSlugs] };
}

/** Meilleures remises du moment (prix barré publié par le shop, produits à prix unique). */
export const deals = (n = 8) => products.filter((p) => p.discount >= 10).sort((a, b) => b.discount - a.discount || byPopularity(a, b)).slice(0, n);

/** Produits liés : même catégorie, même type de préférence, prix voisin. */
export function related(p: Product, n = 8): Product[] {
  return productsByCategory(p.category)
    .filter((x) => x.id !== p.id)
    .map((x) => ({ x, score: (x.strainType && x.strainType === p.strainType ? 0 : 1) * 1e7 + Math.abs(x.from - p.from) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map((s) => s.x);
}

export const coupons: Coupon[] = couponsRaw as Coupon[];
export const couponsForShop = (slug: string) => coupons.filter((c) => c.shop === slug);

/** Empreinte stable pour faire varier les formulations d'une page à l'autre. */
export function pick<T>(seed: string, options: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

/** Texte de secours quand aucune description n'a encore été générée pour un produit. */
export function fallbackText(p: Product, l: Lang, price: (c: number) => string): ProductText {
  const n = p.shopCount;
  const formats = p.weights.length ? p.weights.join(", ") : null;
  if (l === "en") {
    return {
      meta: `${p.name}: compare prices across ${n === 1 ? "one Canadian online shop" : `${n} Canadian online shops`}, from ${price(p.from)}.`,
      lead: `${p.name} is listed by ${n === 1 ? "one online shop" : `${n} online shops`} that deliver across Canada.`,
      sections: [{ h: `About ${p.name}`, p: [`The lowest price we found is ${price(p.from)} at ${p.offers[0].shop.name}.${formats ? ` Formats: ${formats}.` : ""}`] }],
      faq: [],
    };
  }
  return {
    meta: `${p.name} : comparez les prix de ${n === 1 ? "une boutique en ligne canadienne" : `${n} boutiques en ligne canadiennes`}, dès ${price(p.from)}.`,
    lead: `${p.name} est proposé par ${n === 1 ? "une boutique en ligne" : `${n} boutiques en ligne`} qui livrent partout au Canada.`,
    sections: [{ h: `À propos de ${p.name}`, p: [`Le prix le plus bas relevé est de ${price(p.from)} chez ${p.offers[0].shop.name}.${formats ? ` Formats : ${formats}.` : ""}`] }],
    faq: [],
  };
}
