// Exporte le catalogue de la base D1 « cana-catalog » vers src/data/generated/*.json pour le build Astro.
// Nécessite CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID dans l'environnement (jamais commités).
// Usage : node scripts/export-data.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const DB_ID = "b1792254-2898-4c6b-8175-4a7ad127d183";
const { CLOUDFLARE_API_TOKEN: TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT } = process.env;
if (!TOKEN || !ACCOUNT) throw new Error("CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID requis");

async function q(sql, params = []) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB_ID}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const j = await res.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return j.result[0].results;
}

const out = new URL("../src/data/generated/", import.meta.url);
mkdirSync(out, { recursive: true });
const save = (name, data) => writeFileSync(new URL(`${name}.json`, out), JSON.stringify(data));

const shops = await q(
  `SELECT id, slug, name, domain, category, platform, affiliate_url, deeplink_mode, deeplink_param, lifetime, priority
   FROM shops WHERE status = 'active' ORDER BY priority DESC`,
);
const products = await q(
  `SELECT id, slug, name, category, strain_type, weight, first_seen FROM products WHERE status = 'active'`,
);
// Offres en stock uniquement, avec prix ; une ligne par (produit, shop)
const offers = await q(
  `SELECT o.product_id, o.shop_id, o.product_url, o.price_cents, o.compare_at_cents, o.currency, o.in_stock, o.raw_name, o.image_url, o.first_seen, o.last_seen
   FROM product_offers o JOIN shops s ON s.id = o.shop_id
   WHERE s.status = 'active' AND o.in_stock = 1 AND o.price_cents IS NOT NULL AND o.price_cents > 0`,
);
const coupons = await q(
  `SELECT c.code, c.description, c.kind, c.value, c.valid_until, c.source, c.verified, c.updated_at, s.slug AS shop
   FROM coupons c JOIN shops s ON s.id = c.shop_id`,
);
const images = await q(`SELECT product_id, path, model FROM product_images WHERE position = 1`);
const runs = await q(
  `SELECT s.slug, max(r.finished_at) AS last_ok FROM scrape_runs r JOIN shops s ON s.id = r.shop_id WHERE r.status = 'ok' GROUP BY s.slug`,
);

// Contenu éditorial des fiches (site pilot) : par paquets, les corps de texte sont volumineux
const contentByProduct = {};
for (let offset = 0; ; offset += 1500) {
  const rows = await q(
    `SELECT c.entity_id, c.lang, c.field, c.body FROM content c JOIN sites s ON s.id = c.site_id
     WHERE s.slug = 'pilot' AND c.entity_type = 'product' ORDER BY c.id LIMIT 1500 OFFSET ${offset}`,
  );
  for (const r of rows) {
    const e = (contentByProduct[r.entity_id] ??= {});
    if (r.field === "facts") e.facts = JSON.parse(r.body);
    else if (r.field === "page") e[r.lang] = JSON.parse(r.body);
  }
  if (rows.length < 1500) break;
}
for (const [id, e] of Object.entries(contentByProduct)) if (!e.en || !e.fr) delete contentByProduct[id];
save("content-products", contentByProduct);

save("shops", shops);
save("products", products);
save("offers", offers);
save("coupons", coupons);
save("images", images);
save("runs", runs);
save("meta", { exported_at: new Date().toISOString() });
console.log(`export : ${shops.length} shops, ${products.length} produits, ${offers.length} offres en stock, ${coupons.length} coupons, ${Object.keys(contentByProduct).length} fiches rédigées`);
