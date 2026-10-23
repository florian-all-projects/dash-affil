// Normalisation des produits scrapés : nettoyage du nom, clé canonique, catégorie, exclusions.
// Pur (sans I/O) pour être testable hors Cloudflare.

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#039;": "'", "&apos;": "'", "&nbsp;": " ",
};

/** Décode les entités HTML courantes renvoyées par l'API WooCommerce (&#8211;, &#038;, &amp;...). */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&[a-z]+;|&#0?39;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

export function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** slug ASCII : minuscules, accents retirés, tirets. */
export function slugify(s: string): string {
  return s
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/**
 * Clé canonique (PLAN §5) : le nom normalisé, grade compris.
 * Un grade (AAA, AAAA+...) ou un « smalls only » est un produit différent, avec son propre prix :
 * on ne les fusionne pas. Le rapprochement entre shops (matching flou) viendra plus tard.
 */
export function canonicalKey(name: string): string {
  return slugify(decodeEntities(name)) || `p-${fnv1a(name)}`;
}

// Hors périmètre : le catalogue ne couvre que le cannabis, le CBD, les graines et les accessoires.
// Les autres substances (psilocybine, etc.) vendues par certains shops sont exclues.
const EXCLUDE = /psilocyb|magic[\s-]*mushroom|\bshrooms?\b|mushroom|amanita|\bdmt\b|\blsd\b|\bmdma\b|ketamine|ayahuasca|mescaline|\bkratom\b|\bpsychedelic/i;

export function isExcluded(name: string, categorySlugs: string[], description = ""): boolean {
  return EXCLUDE.test(name) || categorySlugs.some((c) => EXCLUDE.test(c.replace(/-/g, " "))) || EXCLUDE.test(description.slice(0, 400));
}

const ACCESSORY_NAME = /boveda|humidity pack|integra|grinder|rolling papers?|\bbong\b|\bpipe\b|lighter|\btorch\b|rolling tray|\bstash\b|smell proof|battery|charger/;

export type Category = "flower" | "edible" | "concentrate" | "vape" | "cbd" | "seed" | "accessory" | "other";

const RULES: Array<[Category, RegExp]> = [
  ["vape", /vape|cart(ridge)?s?\b|disposable|\bpen\b/],
  ["edible", /edible|gumm|chocolate|candy|candies|beverage|drink|capsule|baked/],
  ["concentrate", /concentrate|shatter|\bhash\b|\bwax\b|rosin|resin|diamond|budder|kief|distillate|\brso\b|moon[\s-]?rock/],
  ["accessory", /accessor|grinder|\bpipes?\b|bong|rolling|papers?\b|lighter|merch|apparel|storage|\bscales?\b/],
  ["cbd", /\bcbd\b|hemp|\bpets?\b/],
  ["flower", /flower|\bbud\b|cannabis|strain|indica|sativa|hybrid|\baa+\b|ounce|craft|pre[\s-]?roll|shake|smalls/],
];

/** Catégorie à partir des slugs de catégories du shop + du nom, avec la catégorie du shop en repli. */
export function categorize(name: string, categorySlugs: string[], shopCategory: string): Category {
  if (shopCategory === "CBD") return "cbd";
  if (shopCategory === "Graines") return "seed";
  const cats = categorySlugs.join(" ").toLowerCase().replace(/-/g, " ");
  const nm = name.toLowerCase();
  const hay = cats + " " + nm;
  // Graines : seulement les vraies graines (pas l'« huile de graines de chanvre »)
  if (/\b(feminized|feminised|autoflower(ing)?|seeds|seed bank)\b/.test(hay) && !/seed oil|hemp seed/.test(hay)) return "seed";
  // Accessoires évidents d'après le nom, quelle que soit la catégorie du shop
  if (ACCESSORY_NAME.test(nm)) return "accessory";
  // Les catégories du shop d'abord : le nom d'une variété (« Candyland », « Wedding Cake ») tromperait les règles
  for (const [cat, re] of RULES) if (re.test(cats)) return cat;
  for (const [cat, re] of RULES) if (re.test(nm)) return cat;
  return "other";
}

export function strainType(categorySlugs: string[], text: string): "indica" | "sativa" | "hybrid" | null {
  // 1) Catégories du shop d'abord (les plus fiables)
  const cats = categorySlugs.join(" ").toLowerCase();
  const ci = /\bindica\b/.test(cats), cs = /\bsativa\b/.test(cats), ch = /\bhybrid\b/.test(cats);
  if (ci && !cs && !ch) return "indica";
  if (cs && !ci && !ch) return "sativa";
  if (ch && !ci && !cs) return "hybrid";
  // 2) Texte : « indica dominant » / « sativa dominant » priment sur « hybrid »
  const hay = text.toLowerCase();
  if (/indica[\s-]*(dominant|leaning|heavy)/.test(hay)) return "indica";
  if (/sativa[\s-]*(dominant|leaning|heavy)/.test(hay)) return "sativa";
  if (/\bhybrid\b/.test(hay)) return "hybrid";
  const i = /\bindica\b/.test(hay), s = /\bsativa\b/.test(hay);
  if (i && s) return "hybrid";
  if (i) return "indica";
  if (s) return "sativa";
  return null;
}

/** Hash court et stable (FNV-1a 32 bits) pour détecter les changements de prix/stock/nom. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export interface ShopDeeplink {
  deeplink_mode: string | null;   // 'query' | 'path' | 'landing'
  deeplink_param: string | null;  // ex. 'ref=michellelanoy' ou 'ref/140/'
  affiliate_url: string | null;
}

/** Lien « Acheter » : URL produit du shop + identifiant affilié (PLAN §11). */
export function affiliateUrl(productUrl: string, shop: ShopDeeplink): string {
  if (!shop.deeplink_mode || !shop.deeplink_param || shop.deeplink_mode === "landing") {
    return shop.affiliate_url ?? productUrl;
  }
  const u = new URL(productUrl);
  if (shop.deeplink_mode === "query") {
    const [k, v = ""] = shop.deeplink_param.split("=");
    u.searchParams.set(k, v);
    return u.toString();
  }
  // 'path' : AffiliateWP accepte /ref/ID/ en fin de n'importe quelle URL du site
  const base = u.pathname.endsWith("/") ? u.pathname : u.pathname + "/";
  u.pathname = base + shop.deeplink_param.replace(/^\/+/, "");
  return u.toString();
}
