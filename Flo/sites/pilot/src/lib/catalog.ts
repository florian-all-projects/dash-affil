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
export interface Variant { label: string; grams: number | null; ml: number | null; mg: number | null; price: number; regular: number | null; inStock: boolean }
export interface Offer {
  id: number; shop: Shop; url: string; buyUrl: string; price: number; compareAt: number | null;
  variants: Variant[]; gallery: string[]; history: Array<{ price: number; at: string }>;
}
/** Une ligne du tableau « prix par format » : un format (en grammes) et le meilleur prix de chaque shop. */
export interface FormatRow { grams: number; label: string; offers: Array<{ shop: Shop; price: number; regular: number | null; buyUrl: string }>; best: number; ppg: number }
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
  // Données dérivées (calculées au build à partir des faits relevés)
  formats: FormatRow[]; ppg: number | null; grade: string | null; thc: [number, number] | null; cbd: [number, number] | null;
  mgTotal: number | null; indicaPct: number | null; subtype: string; strainKey: string | null; gallery: string[];
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
const ratios = optionalJson<Record<string, number>>("ratios.json", {});
const second = optionalJson<Record<string, string>>("second-images.json", {});
const group = <T extends { offer_id: number }>(rows: T[]) => rows.reduce((m, r) => (m.get(r.offer_id)?.push(r) ?? m.set(r.offer_id, [r]), m), new Map<number, T[]>());
const variantsByOffer = group(optionalJson<Array<{ offer_id: number; label: string; grams: number | null; ml: number | null; mg: number | null; price_cents: number | null; regular_cents: number | null; in_stock: number }>>("variants.json", []));
const galleryByOffer = group(optionalJson<Array<{ offer_id: number; position: number; url: string }>>("gallery.json", []));
const historyByOffer = group(optionalJson<Array<{ offer_id: number; price_cents: number | null; in_stock: number; seen_at: string }>>("history.json", []));

const offersByProduct = new Map<number, Offer[]>();
for (const o of offersRaw as Array<{ id: number; product_id: number; shop_id: number; product_url: string; price_cents: number; compare_at_cents: number | null }>) {
  const shop = shopById.get(o.shop_id);
  if (!shop) continue;
  const list = offersByProduct.get(o.product_id) ?? [];
  const buyUrl = affiliateUrl(o.product_url, shop);
  list.push({
    id: o.id, shop, url: o.product_url, buyUrl, price: o.price_cents, compareAt: o.compare_at_cents,
    variants: (variantsByOffer.get(o.id) ?? []).filter((v) => v.price_cents && v.price_cents > 0).map((v) => ({ label: v.label, grams: v.grams, ml: v.ml, mg: v.mg, price: v.price_cents!, regular: v.regular_cents, inStock: !!v.in_stock })),
    gallery: (galleryByOffer.get(o.id) ?? []).map((g) => g.url),
    history: (historyByOffer.get(o.id) ?? []).filter((h) => h.price_cents).map((h) => ({ price: h.price_cents!, at: h.seen_at })),
  });
  offersByProduct.set(o.product_id, list);
}

// Sous-types par catégorie (filtres « Format » des pages catégories)
export const SUBTYPES: Record<string, Array<[string, RegExp]>> = {
  flower: [["preroll", /pre-?rolls?|joints?\b|cones?\b|blunts?/i], ["smalls", /smalls|popcorn|small buds|mini buds/i], ["shake", /shake|\btrim\b/i], ["bulk", /mix (and|&) match|build your own|ounce deal|\bbulk\b|\bqp\b|half pound|pound|\blbs?\b/i], ["craft", /craft/i]],
  edible: [["gummies", /gumm|jell|bears?\b|worms?\b|rings?\b|belts?\b|bombs?\b|sours?\b/i], ["chocolate", /chocolate|choco/i], ["drinks", /drink|soda|\btea\b|coffee|lemonade|\bshots?\b|beverage|syrup|float/i], ["baked", /cookie|brownie|cake|baked|crispy|krisp|wafer/i], ["capsules", /capsule|\bcaps\b|pills?\b|tablet/i], ["candy", /candy|candies|lollipop|caramel|cara-?melt|mints?\b|toffee|freezie/i], ["tincture", /tincture|drops/i]],
  concentrate: [["shatter", /shatter/i], ["hash", /hash|kief/i], ["rosin", /rosin/i], ["liveresin", /live[ -]?resin/i], ["wax", /budder|badder|wax|crumble/i], ["diamonds", /diamond|sauce|thca/i], ["oil", /distillate|\brso\b|phoenix|\boil\b|syringe|tincture/i], ["caviar", /caviar|moon ?rock/i]],
  vape: [["battery", /battery|charger/i], ["disposable", /disposable|\bpen\b/i], ["cartridge", /cart|cartridge|510/i], ["pod", /\bpods?\b/i], ["liquid", /liquid|juice/i]],
  cbd: [["pet", /\bpets?\b|\bdogs?\b|\bcats?\b/i], ["topical", /cream|balm|salve|lotion|\brub\b|roll-?on|stick|topical|massage/i], ["bath", /bath|bomb/i], ["gummies", /gumm|jell/i], ["capsules", /capsule|softgel|pills?\b/i], ["vape", /vape/i], ["isolate", /isolate|powder|crystal/i], ["flower", /flower|pre-?roll|hemp bud/i], ["oil", /\boil\b|tincture|drops/i]],
  seed: [["autoflower", /auto/i], ["fast", /fast/i], ["cbd", /\bcbd\b|\bcbg\b|\bcbn\b/i], ["mix", /\bmix\b|\bpack\b|sampler/i], ["regular", /\bregular\b/i], ["feminized", /femini[sz]ed/i]],
  accessory: [["papers", /paper|cones?\b|wraps?\b|\btips\b|rolling/i], ["grinder", /grinder/i], ["glass", /pipe|bong|bubbler|\brig\b|dab/i], ["storage", /\bjar\b|stash|boveda|humid|container|\bbags?\b|integra/i], ["lighter", /lighter|torch/i], ["vaporizer", /vaporizer/i]],
  other: [],
};
function subtypeOf(cat: string, name: string): string {
  for (const [k, re] of SUBTYPES[cat] ?? []) if (re.test(name)) return k;
  return cat === "flower" ? "buds" : "misc";
}
const gramsInName = (n: string) => { const m = n.match(/(\d+(?:\.\d+)?)\s*(g|grams?)\b/i); return m ? Number(m[1]) : null; };
const pct = (t: string | null | undefined): [number, number] | null => {
  if (!t || !/%/.test(t)) return null;
  const nums = [...t.matchAll(/(\d{1,2}(?:[.,]\d{1,2})?)\s*(?=%|\s*(?:-|–|to|à)\s*\d)/g)].map((m) => Number(m[1].replace(",", "."))).filter((x) => x > 0 && x <= 45);
  return nums.length ? [Math.min(...nums), Math.max(...nums)] : null;
};
/** Clé de variété : le nom sans grade, format, marque de forme ni mentions génériques (sert aux pages variétés). */
export function strainKeyOf(name: string, cat: string): string | null {
  if (!["flower", "concentrate", "vape", "seed"].includes(cat)) return null;
  let s = name.toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(a{2,5}\+?)\b/g, " ")
    .replace(/\d+(\.\d+)?\s*(g|grams?|ml|mg|oz)\b/g, " ")
    .replace(/\b(pre-?rolls?|smalls|popcorn|craft cannabis|craft|cannabis|strain|indica|sativa|hybrid|dominant|shatter|hash|live[- ]resin|rosin|budder|wax|diamonds?|sauce|distillate|cart(ridge)?s?|disposable|vape|pen|seeds?|feminized|feminised|autoflower(ing)?|auto|fast version|fast|regular|bulk|ounce|deal|lso|bc|organic|premium|top shelf|exotic|cbd)\b/g, " ")
    .split(/\s[–|-]\s/)[0]
    .replace(/[^a-z0-9#' ]+/g, " ").replace(/\s+/g, " ").trim();
  if (s.length < 3 || /^\d+$/.test(s) || /mix|match|build your own|sampler|pack|variety/.test(s)) return null;
  return s;
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
    // Prix par format : meilleur prix de chaque shop pour chaque poids (variantes relevées sur les fiches)
    const byGrams = new Map<number, FormatRow>();
    for (const o of offers) {
      const rows = o.variants.length ? o.variants : gramsInName(p.name) ? [{ label: "", grams: gramsInName(p.name), ml: null, mg: null, price: o.price, regular: o.compareAt, inStock: true }] : [];
      for (const v of rows) {
        if (!v.grams || !v.inStock || v.grams > 1000) continue;
        const row = byGrams.get(v.grams) ?? { grams: v.grams, label: `${v.grams} g`, offers: [], best: Infinity, ppg: Infinity };
        const prev = row.offers.find((x) => x.shop.id === o.shop.id);
        if (prev) { if (v.price < prev.price) Object.assign(prev, { price: v.price, regular: v.regular }); }
        else row.offers.push({ shop: o.shop, price: v.price, regular: v.regular, buyUrl: o.buyUrl });
        byGrams.set(v.grams, row);
      }
    }
    const formats = [...byGrams.values()].map((r) => {
      r.offers.sort((a, b) => a.price - b.price);
      r.best = r.offers[0].price;
      r.ppg = Math.round(r.best / r.grams);
      return r;
    }).sort((a, b) => a.grams - b.grams);
    const ppg = formats.length ? Math.min(...formats.map((f) => f.ppg)) : null;
    const f = c?.facts;
    const grade = p.name.match(/\b(A{2,5}\+?)(?=[\s)/,]|$)/)?.[1] ?? (f?.grade && /^A{2,5}\+?$/i.test(f.grade.trim()) ? f.grade.trim() : null);
    const mgName = [...p.name.matchAll(/(\d{2,5})\s*mg/gi)].map((m) => Number(m[1]));
    const gallery = [...new Set(offers.flatMap((o) => o.gallery))];
    return {
      id: p.id, slug: p.slug, name: p.name, category: p.category, strainType: p.strain_type,
      weights: (p.weight ?? "").split("|").map((w) => w.trim()).filter(Boolean).slice(0, 10),
      offers, shopCount: new Set(offers.map((o) => o.shop.slug)).size, from: best.price, primary, discount,
      image, firstSeen: p.first_seen, text: c ? { en: c.en, fr: c.fr } : null, facts: f ?? null,
      formats, ppg, grade: grade ? grade.toUpperCase() : null, thc: pct(f?.thc), cbd: pct(f?.cbd),
      mgTotal: mgName.length ? Math.max(...mgName) : null, indicaPct: ratios[String(p.id)] ?? null,
      subtype: subtypeOf(p.category, p.name), strainKey: null,
      gallery: second[String(p.id)] ? [second[String(p.id)]] : [],
    } satisfies Product;
  })
  .filter((p): p is Product => p !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

// Variétés : un nom de fleur simple (« Gelato (AAAA+) ») ou de graine (« Auto Blueberry Feminized Seeds ») définit une variété ;
// les concentrés, vapoteuses et autres fleurs s'y rattachent quand un segment de leur nom (« Brand – Gelato – Indica ») la cite.
const strainDict = new Map<string, string>(); // clé -> nom affiché
for (const p of products) {
  if (!((p.category === "flower" && ["buds", "smalls", "craft"].includes(p.subtype)) || p.category === "seed")) continue;
  if (/\s[–-]\s/.test(p.name) && p.category === "flower") continue; // « Marque – Variété » : pas une source fiable de nom
  const k = strainKeyOf(p.name, p.category);
  if (k && k.split(" ").length <= 4 && !strainDict.has(k)) strainDict.set(k, p.name.replace(/\s*\([^)]*\)/g, "").replace(/\b(A{2,5}\+?)\b/g, "").replace(/\b(auto|cbd|fast version|feminized|feminised|autoflower|cannabis|seeds?|regular)\b/gi, "").replace(/\s+/g, " ").trim());
}
for (const p of products) {
  if (!["flower", "concentrate", "vape", "seed"].includes(p.category)) continue;
  const segs = [p.name, ...p.name.split(/\s[–|-]\s|\s\+\s|\sx\s/i)];
  let best: string | null = null;
  for (const seg of segs) {
    const k = strainKeyOf(seg, p.category);
    if (k && strainDict.has(k) && (!best || k.length > best.length)) best = k;
  }
  p.strainKey = best;
}
export const strainName = (k: string) => (strainDict.get(k) ?? k).replace(/\s*\+\s*$/, "").replace(/^\+\s*/, "").trim();
export const strainSlug = (k: string) => k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['#]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
/** Classement « les plus comparés » : nombre de shops, puis présence d'une image propre, puis prix. */
export function byPopularity(a: Product, b: Product) {
  return b.shopCount - a.shopCount || (a.image.kind === "category" ? 1 : 0) - (b.image.kind === "category" ? 1 : 0) || a.from - b.from;
}
/** Variétés qui ont une page : au moins 2 produits rattachés. */
export const strains = (() => {
  const g = new Map<string, Product[]>();
  for (const p of products) if (p.strainKey) (g.get(p.strainKey) ?? g.set(p.strainKey, []).get(p.strainKey)!).push(p);
  return [...g.entries()].filter(([, l]) => l.length >= 2).map(([key, list]) => ({ key, slug: strainSlug(key), name: strainName(key), products: list.sort(byPopularity) }))
    .sort((a, b) => b.products.length - a.products.length);
})();
export const strainBySlug = new Map(strains.map((st) => [st.slug, st]));
export const strainOf = (p: Product) => (p.strainKey ? strains.find((st) => st.key === p.strainKey) ?? null : null);

/** Valeurs de comparaison pour situer un produit : même catégorie et même sous-type quand l'échantillon est assez grand. */
export function peers(p: Product): Product[] {
  const same = products.filter((x) => x.category === p.category && x.subtype === p.subtype);
  return same.length >= 25 ? same : productsByCategory(p.category);
}
export const ppgValues = (list: Product[]) => list.map((x) => x.ppg).filter((v): v is number => v !== null && v > 0);
export const thcValues = (list: Product[]) => list.map((x) => x.thc?.[1]).filter((v): v is number => v !== undefined && v > 0);
/** Comparateur « produits similaires » : même catégorie et sous-type, même type de variété si possible, prix au gramme proche. */
export function similar(p: Product, n = 5): Product[] {
  return products
    .filter((x) => x.id !== p.id && x.category === p.category && x.subtype === p.subtype)
    .map((x) => ({ x, score: (x.strainType === p.strainType ? 0 : 1) * 1e7 + Math.abs((x.ppg ?? x.from) - (p.ppg ?? p.from)) }))
    .sort((a, b) => a.score - b.score).slice(0, n).map((y) => y.x);
}

export const productBySlug = new Map(products.map((p) => [p.slug, p]));
export const productsByCategory = (cat: string) => products.filter((p) => p.category === cat);
export const productsByShop = (slug: string) => products.filter((p) => p.offers.some((o) => o.shop.slug === slug));
export const activeShops = shops.filter((s) => products.some((p) => p.offers.some((o) => o.shop.slug === s.slug)));


export function categoryStats(cat: string) {
  const list = productsByCategory(cat);
  if (!list.length) return null;
  const cheapest = list.reduce((a, b) => (b.from < a.from ? b : a));
  const shopSlugs = new Set(list.flatMap((p) => p.offers.map((o) => o.shop.slug)));
  return { count: list.length, from: cheapest.from, cheapest, shops: shopSlugs.size, shopSlugs: [...shopSlugs] };
}

/** Meilleures remises du moment (prix barré publié par le shop, produits à prix unique). */
export const deals = (n = 8) => products.filter((p) => p.discount >= 10).sort((a, b) => b.discount - a.discount || byPopularity(a, b)).slice(0, n);

/** Vitrine variée : tour à tour une fleur, un comestible, un concentré… (les accessoires en dernier), les plus comparés d'abord. */
export function showcase(list: Product[], n = 12): Product[] {
  const order = ["flower", "edible", "concentrate", "vape", "cbd", "seed", "other", "accessory"];
  const queues = order.map((c) => list.filter((p) => p.category === c).sort(byPopularity));
  const out: Product[] = [];
  for (let round = 0; out.length < n && queues.some((q) => q.length > round); round++) {
    for (const q of queues) if (q[round] && out.length < n) out.push(q[round]);
  }
  return out;
}

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
/** Codes publiables : on écarte ceux notés expirés ; la description interne (notes en français) n'est jamais affichée. */
export const couponsForShop = (slug: string) => coupons.filter((c) => c.shop === slug && !/expir/i.test(c.description ?? "")).sort((a, b) => b.verified - a.verified);
/** Libellé public d'un code : « 20 % off » / « 20 % de rabais », d'après kind/value. */
export function couponLabel(c: Coupon, l: Lang): string {
  if (c.kind === "percent" && c.value) return l === "en" ? `${c.value}% off` : `${c.value} % de rabais`;
  if (c.kind === "amount" && c.value) return l === "en" ? `$${c.value} off` : `${c.value} $ de rabais`;
  if (c.kind === "shipping") return l === "en" ? "Free shipping" : "Livraison gratuite";
  return l === "en" ? "Discount at checkout" : "Rabais au paiement";
}

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
