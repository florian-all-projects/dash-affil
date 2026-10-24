// Collecte universelle (PLAN §3, méthode n°3) : on énumère les URL produits (sitemap ou pages de liste),
// puis on lit le JSON-LD schema.org/Product de chaque fiche. Sert aux shops sans API (AbanteCart : QCS, Toronto Seeds).

import { categorize, canonicalKey, decodeEntities, isExcluded, strainType, stripHtml } from "./normalize";
import type { ScrapedOffer } from "./woo";
import { ChallengeError } from "./woo";

/** Configuration d'énumération stockée dans shops.scrape_config (JSON). */
export type DiscoverConfig =
  | { discover: "sitemap"; url: string; exclude?: string }
  | { discover: "listing"; url: string; link: string; maxPages?: number; exclude?: string };

const UA = "Mozilla/5.0 (compatible; BudboardBot/1.0; price comparison)";

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xml" } });
  const body = await res.text();
  if (res.status === 403 || res.status === 503 || /<title>Just a moment/i.test(body)) throw new ChallengeError(`${res.status} ${url}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return body;
}

/** Liste des URL à visiter, dans un ordre stable. */
export async function discover(cfg: DiscoverConfig): Promise<string[]> {
  const urls: string[] = [];
  const seen = new Set<string>();
  const ex = cfg.exclude ? new RegExp(cfg.exclude, "i") : null;
  const push = (u: string) => {
    const clean = decodeEntities(u).split("#")[0];
    if (!seen.has(clean) && !(ex && ex.test(clean))) { seen.add(clean); urls.push(clean); }
  };
  if (cfg.discover === "sitemap") {
    const xml = await get(cfg.url);
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) push(m[1]);
  } else {
    const re = new RegExp(cfg.link, "g");
    for (let page = 1; page <= (cfg.maxPages ?? 10); page++) {
      const html = await get(cfg.url.replace("{page}", String(page)));
      const before = urls.length;
      for (const m of html.matchAll(re)) push(m[1]);
      if (urls.length === before) break; // page vide ou répétée : fin de la liste
    }
  }
  return urls;
}

interface LdProduct {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  image?: string | string[] | { url?: string };
  offers?: LdOffer | LdOffer[];
}
interface LdOffer { price?: string | number; lowPrice?: string | number; priceCurrency?: string; availability?: string; url?: string }

/** Trouve le premier objet Product dans les blocs JSON-LD d'une page. */
export function findLdProduct(html: string): LdProduct | null {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const stack: unknown[] = [data];
    while (stack.length) {
      const x = stack.pop();
      if (Array.isArray(x)) { stack.push(...x); continue; }
      if (x && typeof x === "object") {
        const o = x as Record<string, unknown>;
        const t = o["@type"];
        if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return o as LdProduct;
        if (Array.isArray(o["@graph"])) stack.push(...(o["@graph"] as unknown[]));
      }
    }
  }
  return null;
}

/** Transforme un Product JSON-LD en offre normalisée (null si ce n'est pas un produit ou s'il est hors périmètre). */
export function mapLdProduct(p: LdProduct, pageUrl: string, shopCategory: string): ScrapedOffer | null {
  // « Bubba Kush Feminized Seeds | 90% Indica, 18–20% THC » → le nom avant le « | »
  const name = decodeEntities(p.name ?? "").split(" | ")[0].replace(/\s+/g, " ").trim();
  const desc = stripHtml(decodeEntities(p.description ?? ""));
  if (!name || isExcluded(name, [], desc)) return null;
  const offer = Array.isArray(p.offers) ? p.offers[0] : p.offers;
  const amount = offer?.price ?? offer?.lowPrice;
  const n = amount === undefined ? NaN : Number(amount);
  const price = Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
  const img = Array.isArray(p.image) ? p.image[0] : typeof p.image === "string" ? p.image : p.image?.url;
  // L'URL canonique de l'offre prime sur l'URL visitée (une fiche peut être listée sous /categorie/fiche)
  const canonical = offer?.url && /^https?:\/\//.test(offer.url) ? offer.url : pageUrl;
  const url = new URL(canonical);
  return {
    sourceId: url.pathname,
    rawName: p.name ?? name,
    name,
    canonicalKey: canonicalKey(name),
    category: categorize(name, [], shopCategory),
    strainType: strainType([], desc),
    productUrl: canonical,
    priceCents: price,
    compareAtCents: null,
    currency: offer?.priceCurrency || "CAD",
    inStock: !offer?.availability || /InStock|PreOrder/i.test(offer.availability),
    imageUrl: img ?? null,
    descriptionSrc: desc.slice(0, 4000),
    weights: null,
  };
}

/** Lit une liste de fiches et renvoie les offres trouvées (les pages sans Product sont ignorées). */
export async function fetchLdProducts(urls: string[], shopCategory: string): Promise<{ offers: ScrapedOffer[]; skipped: number }> {
  const offers: ScrapedOffer[] = [];
  let skipped = 0;
  for (const u of urls) {
    let html: string;
    try { html = await get(u); } catch (e) { if (e instanceof ChallengeError) throw e; skipped++; continue; }
    const p = findLdProduct(html);
    const o = p ? mapLdProduct(p, u, shopCategory) : null;
    if (o && o.priceCents) offers.push(o);
    else skipped++;
  }
  return { offers, skipped };
}
