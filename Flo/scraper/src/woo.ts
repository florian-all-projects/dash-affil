// Collecte WooCommerce via la Store API publique : /wp-json/wc/store/v1/products
// (PLAN §3, méthode n°2 de la cascade). Aucune authentification nécessaire.

import { categorize, canonicalKey, decodeEntities, isExcluded, stripHtml, strainType, type Category } from "./normalize";

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  permalink: string;
  short_description?: string;
  description?: string;
  prices?: {
    price?: string;
    regular_price?: string;
    sale_price?: string;
    currency_code?: string;
    currency_minor_unit?: number;
    price_range?: { min_amount?: string; max_amount?: string } | null;
  };
  is_in_stock?: boolean;
  images?: Array<{ src: string; alt?: string }>;
  categories?: Array<{ slug: string; name: string }>;
  attributes?: Array<{ name: string; terms?: Array<{ name: string }> }>;
}

export interface ScrapedOffer {
  sourceId: string;
  rawName: string;
  name: string;
  canonicalKey: string;
  category: Category;
  strainType: "indica" | "sativa" | "hybrid" | null;
  productUrl: string;
  priceCents: number | null;
  compareAtCents: number | null;
  currency: string;
  inStock: boolean;
  imageUrl: string | null;
  descriptionSrc: string;
  weights: string | null;
}

/** Convertit un montant Store API (unités mineures, en chaîne) en centimes. */
export function toCents(amount: string | undefined, minorUnit = 2): number | null {
  if (amount === undefined || amount === null || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * Math.pow(10, 2 - minorUnit));
}

/** Transforme un produit Store API en offre normalisée, ou null s'il est hors périmètre. */
export function mapWooProduct(p: WooProduct, shopCategory: string): ScrapedOffer | null {
  const rawName = p.name ?? "";
  const name = decodeEntities(rawName).replace(/\s+/g, " ").trim();
  const cats = (p.categories ?? []).map((c) => c.slug);
  const desc = stripHtml(p.short_description || p.description || "");
  if (!name || isExcluded(name, cats, desc)) return null;

  const pr = p.prices ?? {};
  const minor = pr.currency_minor_unit ?? 2;
  // Produit variable : on garde le prix « à partir de » (min de la fourchette quand elle existe).
  const price = toCents(pr.price_range?.min_amount ?? pr.price, minor);
  const regular = toCents(pr.regular_price, minor);
  const weights = (p.attributes ?? [])
    .filter((a) => /gram|gms|\bg\b|weight|size|oz|ounce|format|quantity/i.test(a.name))
    .flatMap((a) => (a.terms ?? []).map((t) => t.name))
    .join("|") || null;

  return {
    sourceId: String(p.id),
    rawName,
    name,
    canonicalKey: canonicalKey(name),
    category: categorize(name, cats, shopCategory),
    strainType: strainType(cats, desc),
    productUrl: p.permalink,
    priceCents: price,
    compareAtCents: regular !== null && price !== null && regular > price ? regular : null,
    currency: pr.currency_code || "CAD",
    inStock: p.is_in_stock !== false,
    imageUrl: p.images?.[0]?.src ?? null,
    descriptionSrc: desc.slice(0, 2000),
    weights,
  };
}

export class ChallengeError extends Error {}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

/** Récupère une page de la Store API. Lève ChallengeError si le shop renvoie une page anti-bot. */
export async function fetchWooPage(domain: string, page: number, perPage = 100): Promise<{ items: WooProduct[]; totalPages: number }> {
  const url = `https://${domain}/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}&orderby=id&order=asc`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  const type = res.headers.get("content-type") || "";
  if (!type.includes("json")) {
    const head = (await res.text()).slice(0, 200);
    if (/just a moment|cf-chl|challenge/i.test(head)) throw new ChallengeError(`challenge anti-bot (${res.status})`);
    throw new Error(`réponse non JSON (${res.status}) : ${head.slice(0, 80)}`);
  }
  if (res.status === 400 && page > 1) return { items: [], totalPages: page - 1 }; // page au-delà de la fin
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = (await res.json()) as WooProduct[];
  const totalPages = Number(res.headers.get("x-wp-totalpages") || "0") || page;
  return { items, totalPages };
}
