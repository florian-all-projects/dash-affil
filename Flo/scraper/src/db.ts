// Écriture dans D1 : produits canoniques, offres par shop, historique des prix, journal des runs.

import { fnv1a } from "./normalize";
import type { ScrapedOffer } from "./woo";

export interface ShopRow {
  id: number;
  slug: string;
  name: string;
  domain: string;
  category: string;
  platform: string | null;
  status: string;
}

export interface RunStats {
  pages: number;
  seen: number;
  created: number;
  priceChanged: number;
  excluded: number;
}

export function offerHash(o: ScrapedOffer): string {
  return fnv1a([o.name, o.priceCents, o.compareAtCents, o.inStock ? 1 : 0, o.productUrl].join("|"));
}

export async function startRun(db: D1Database, shopId: number, method: string): Promise<number> {
  const row = await db
    .prepare("INSERT INTO scrape_runs (shop_id, method, status) VALUES (?, ?, 'running') RETURNING id")
    .bind(shopId, method)
    .first<{ id: number }>();
  return row!.id;
}

export async function finishRun(db: D1Database, runId: number, status: string, s: RunStats, error: string | null) {
  await db
    .prepare(
      `UPDATE scrape_runs SET finished_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'), status = ?, pages_fetched = ?,
       offers_seen = ?, offers_new = ?, prices_changed = ?, error = ? WHERE id = ?`,
    )
    .bind(status, s.pages, s.seen, s.created, s.priceChanged, error, runId)
    .run();
}

/** Empreintes connues des offres d'un shop, pour ne retraiter que ce qui a changé (PLAN §4). */
export async function loadOfferHashes(db: D1Database, shopId: number): Promise<Map<string, string>> {
  const { results } = await db
    .prepare("SELECT source_id, offer_hash FROM product_offers WHERE shop_id = ?")
    .bind(shopId)
    .all<{ source_id: string; offer_hash: string | null }>();
  return new Map(results.map((r) => [r.source_id, r.offer_hash ?? ""]));
}

/**
 * Enregistre une page d'offres en un seul batch D1.
 * - produit canonique : créé s'il n'existe pas, sinon last_seen mis à jour ;
 * - offre : insérée, ou mise à jour seulement si son empreinte a changé ;
 * - historique de prix : une ligne à la création et à chaque changement.
 */
export async function saveOffers(
  db: D1Database,
  shop: ShopRow,
  offers: ScrapedOffer[],
  known: Map<string, string>,
  stats: RunStats,
): Promise<void> {
  const stmts: D1PreparedStatement[] = [];
  for (const o of offers) {
    const hash = offerHash(o);
    const previous = known.get(o.sourceId);
    stats.seen++;

    stmts.push(
      db
        .prepare(
          `INSERT INTO products (canonical_key, name, slug, category, strain_type, weight, status)
           VALUES (?, ?, ?, ?, ?, ?, 'active')
           ON CONFLICT(canonical_key) DO UPDATE SET last_seen = strftime('%Y-%m-%dT%H:%M:%SZ','now'), status = 'active'`,
        )
        .bind(o.canonicalKey, o.name, o.canonicalKey, o.category, o.strainType, o.weights),
    );

    if (previous === hash) {
      // Rien n'a changé : on note seulement qu'on l'a revu.
      stmts.push(
        db
          .prepare("UPDATE product_offers SET last_seen = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE shop_id = ? AND source_id = ?")
          .bind(shop.id, o.sourceId),
      );
      continue;
    }

    if (previous === undefined) stats.created++;
    else stats.priceChanged++;
    known.set(o.sourceId, hash);

    stmts.push(
      db
        .prepare(
          `INSERT INTO product_offers (product_id, shop_id, source_id, product_url, price_cents, compare_at_cents, currency,
             in_stock, raw_name, image_url, description_src, offer_hash)
           VALUES ((SELECT id FROM products WHERE canonical_key = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(shop_id, source_id) DO UPDATE SET
             product_id = excluded.product_id, product_url = excluded.product_url, price_cents = excluded.price_cents,
             compare_at_cents = excluded.compare_at_cents, currency = excluded.currency, in_stock = excluded.in_stock,
             raw_name = excluded.raw_name, image_url = excluded.image_url, description_src = excluded.description_src,
             offer_hash = excluded.offer_hash, last_seen = strftime('%Y-%m-%dT%H:%M:%SZ','now')`,
        )
        .bind(
          o.canonicalKey, shop.id, o.sourceId, o.productUrl, o.priceCents, o.compareAtCents, o.currency,
          o.inStock ? 1 : 0, o.rawName, o.imageUrl, o.descriptionSrc, hash,
        ),
      db
        .prepare(
          `INSERT INTO price_history (offer_id, price_cents, in_stock)
           SELECT id, ?, ? FROM product_offers WHERE shop_id = ? AND source_id = ?`,
        )
        .bind(o.priceCents, o.inStock ? 1 : 0, shop.id, o.sourceId),
    );
  }
  if (stmts.length) await db.batch(stmts);
}

/** Offres absentes du dernier run complet : marquées hors stock (le produit peut revenir). */
export async function markMissing(db: D1Database, shopId: number, runStartedAt: string): Promise<number> {
  const r = await db
    .prepare("UPDATE product_offers SET in_stock = 0 WHERE shop_id = ? AND last_seen < ? AND in_stock != 0")
    .bind(shopId, runStartedAt)
    .run();
  return r.meta.changes ?? 0;
}
