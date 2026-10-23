// Modèle de données du site, construit à partir de l'export D1 (src/data/generated/*.json).
import shopsRaw from "../data/generated/shops.json";
import productsRaw from "../data/generated/products.json";
import offersRaw from "../data/generated/offers.json";
import couponsRaw from "../data/generated/coupons.json";
import imagesRaw from "../data/generated/images.json";
import metaRaw from "../data/generated/meta.json";
import type { Lang } from "./i18n";

export interface Shop {
  id: number; slug: string; name: string; domain: string; category: string; platform: string | null;
  affiliate_url: string | null; deeplink_mode: string | null; deeplink_param: string | null; lifetime: number; priority: number;
}
export interface Offer {
  shop: Shop; url: string; buyUrl: string; price: number; compareAt: number | null;
}
export interface Product {
  id: number; slug: string; name: string; category: string; strainType: string | null; weights: string[];
  offers: Offer[]; shopCount: number; from: number; primary: Offer; discount: number; image: string | null; firstSeen: string;
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

const images = new Map((imagesRaw as Array<{ product_id: number; path: string }>).map((i) => [i.product_id, i.path]));
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
    return {
      id: p.id, slug: p.slug, name: p.name, category: p.category, strainType: p.strain_type,
      weights: (p.weight ?? "").split("|").map((w) => w.trim()).filter(Boolean).slice(0, 8),
      offers, shopCount: new Set(offers.map((o) => o.shop.slug)).size, from: best.price, primary, discount, image: images.get(p.id) ?? null, firstSeen: p.first_seen,
    } satisfies Product;
  })
  .filter((p): p is Product => p !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

export const productsByCategory = (cat: string) => products.filter((p) => p.category === cat);
export const productsByShop = (slug: string) => products.filter((p) => p.offers.some((o) => o.shop.slug === slug));

export function categoryStats(cat: string) {
  const list = productsByCategory(cat);
  if (!list.length) return null;
  const cheapest = list.reduce((a, b) => (b.from < a.from ? b : a));
  return { count: list.length, from: cheapest.from, cheapest, shops: new Set(list.flatMap((p) => p.offers.map((o) => o.shop.slug))).size };
}

/** Meilleures remises du moment (prix barré publié par le shop). */
export const deals = (n = 8) => products.filter((p) => p.discount >= 10).sort((a, b) => b.discount - a.discount).slice(0, n);

export const coupons: Coupon[] = couponsRaw as Coupon[];
export const couponsForShop = (slug: string) => coupons.filter((c) => c.shop === slug);

/** Empreinte stable pour faire varier les formulations d'une page à l'autre. */
export function pick<T>(seed: string, options: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

const TYPE = {
  en: { indica: "indica", sativa: "sativa", hybrid: "hybrid" },
  fr: { indica: "indica", sativa: "sativa", hybrid: "hybride" },
} as const;
const NOUN = {
  en: { flower: "flower", edible: "edible", concentrate: "concentrate", vape: "vape product", cbd: "CBD product", seed: "seed pack", accessory: "accessory", other: "product" },
  fr: { flower: "fleur", edible: "produit comestible", concentrate: "concentré", vape: "produit à vapoter", cbd: "produit au CBD", seed: "lot de graines", accessory: "accessoire", other: "produit" },
} as const;

/** Texte de fiche produit construit à partir des faits (prix, formats, shops) : unique par produit, sans copier la fiche du shop. */
export function productBlurb(p: Product, l: Lang, price: (c: number) => string): string[] {
  const type = p.strainType ? TYPE[l][p.strainType as keyof (typeof TYPE)["en"]] : null;
  const noun = NOUN[l][p.category as keyof (typeof NOUN)["en"]] ?? NOUN[l].other;
  const n = p.shopCount;
  const shopNames = [...new Set(p.offers.map((o) => o.shop.name))];
  const formats = p.weights.length ? p.weights.join(", ") : null;
  const art = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
  if (l === "en") {
    const what = type ? `${art(type)} ${type} ${noun}` : `${art(noun)} ${noun}`;
    const opener = pick(p.slug, [
      `${p.name} is ${what} currently listed by ${n === 1 ? shopNames[0] : `${n} online shops`}.`,
      `We track ${p.name}, ${what}, across ${n === 1 ? "one Canadian online shop" : `${n} Canadian online shops`}.`,
      `${p.name} shows up on our weekly price check as ${what} sold by ${shopNames.join(" and ")}.`,
    ]);
    const priceLine = `The lowest price we found is ${price(p.from)} at ${p.offers[0].shop.name}${p.discount ? `, ${p.discount}% below its listed regular price` : ""}.`;
    const formatLine = formats ? `It comes in these formats: ${formats}. The price shown is for the smallest option.` : "";
    return [opener + " " + priceLine, formatLine].filter(Boolean);
  }
  const fem = p.category === "flower";
  const un = fem ? "une" : "un";
  const e = fem ? "e" : "";
  const what = type ? `${un} ${noun} ${type}` : `${un} ${noun}`;
  const opener = pick(p.slug, [
    `${p.name} est ${what} proposé${e} par ${n === 1 ? shopNames[0] : `${n} boutiques en ligne`}.`,
    `Nous suivons le prix de ${p.name}, ${what}, chez ${n === 1 ? "une boutique en ligne canadienne" : `${n} boutiques en ligne canadiennes`}.`,
    `${p.name} figure dans notre relevé de prix hebdomadaire : ${what} vendu${e} par ${shopNames.join(" et ")}.`,
  ]);
  const priceLine = `Le prix le plus bas relevé est de ${price(p.from)} chez ${p.offers[0].shop.name}${p.discount ? `, soit ${p.discount} % sous le prix habituel affiché` : ""}.`;
  const formatLine = formats ? `Formats disponibles : ${formats}. Le prix indiqué correspond au plus petit format.` : "";
  return [opener + " " + priceLine, formatLine].filter(Boolean);
}
