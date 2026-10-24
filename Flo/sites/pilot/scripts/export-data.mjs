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
  `SELECT o.id, o.product_id, o.shop_id, o.product_url, o.price_cents, o.compare_at_cents, o.currency, o.in_stock, o.raw_name, o.image_url, o.first_seen, o.last_seen
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

// Annuaire des magasins autorisés (registres provinciaux), avec la ville rattachée
const stores = [];
for (let offset = 0; ; offset += 2000) {
  const rows = await q(
    `SELECT c.province, c.slug AS citySlug, c.name AS cityName, c.name_fr AS cityNameFr, s.name, s.address, s.postal_code AS postal,
            s.phone, s.website, s.lat, s.lng AS lon, s.source, s.source_url AS sourceUrl
     FROM physical_shops s JOIN cities c ON c.id = s.city_id ORDER BY s.id LIMIT 2000 OFFSET ${offset}`,
  );
  stores.push(...rows);
  if (rows.length < 2000) break;
}
save("stores", stores);
// Contenus des pages (accueil, catégories, provinces, villes, boutiques) : clé « type:clé »
const contentPages = {};
for (let offset = 0; ; offset += 1500) {
  const rows = await q(
    `SELECT c.entity_type, c.lang, c.body FROM content c JOIN sites s ON s.id = c.site_id
     WHERE s.slug = 'pilot' AND c.entity_type IN ('home','category','province','city','shop','guide') AND c.field = 'page'
     ORDER BY c.id LIMIT 1500 OFFSET ${offset}`,
  );
  for (const r of rows) {
    const b = JSON.parse(r.body);
    (contentPages[`${r.entity_type}:${b.key}`] ??= {})[r.lang] = b;
  }
  if (rows.length < 1500) break;
}
save("content-pages", contentPages);

// Variantes (prix par format), galeries et historique des prix des offres en stock (tables remplies par
// Flo/scraper/scripts/collect-variants.ts et par le Worker) ; absentes => fichiers vides
async function qAll(sql, size = 4000) {
  const out = [];
  for (let offset = 0; ; offset += size) {
    let rows;
    try { rows = await q(`${sql} LIMIT ${size} OFFSET ${offset}`); } catch { return out; }
    out.push(...rows);
    if (rows.length < size) return out;
  }
}
const inStock = `SELECT o.id FROM product_offers o JOIN shops s ON s.id = o.shop_id WHERE s.status = 'active' AND o.in_stock = 1`;
const variants = await qAll(`SELECT offer_id, label, grams, ml, mg, price_cents, regular_cents, in_stock FROM offer_variants WHERE offer_id IN (${inStock}) ORDER BY offer_id, grams`);
save("variants", variants);
const gallery = await qAll(`SELECT offer_id, position, url FROM offer_images WHERE offer_id IN (${inStock}) ORDER BY offer_id, position`);
save("gallery", gallery);
const history = await qAll(`SELECT offer_id, price_cents, in_stock, seen_at FROM price_history WHERE offer_id IN (${inStock}) ORDER BY offer_id, seen_at`);
save("history", history);
// Ratio indica/sativa publié par le shop (« 80% Indica / 20% Sativa ») : extrait ici, la description n'est pas exportée
const ratios = {};
for (const r of await qAll(`SELECT product_id, description_src FROM product_offers WHERE id IN (${inStock}) AND description_src LIKE '%\%%' ESCAPE '\\'`)) {
  const t = (r.description_src || "").replace(/\s+/g, " ");
  const i = t.match(/(\d{1,3})\s*%\s*indica/i) || t.match(/indica\s*[:(-]?\s*(\d{1,3})\s*%/i);
  const sv = t.match(/(\d{1,3})\s*%\s*sativa/i) || t.match(/sativa\s*[:(-]?\s*(\d{1,3})\s*%/i);
  let ind = i ? Number(i[1]) : sv ? 100 - Number(sv[1]) : null;
  if (ind !== null && ind >= 0 && ind <= 100 && (!i || !sv || Math.abs(Number(i[1]) + Number(sv[1]) - 100) <= 2)) ratios[r.product_id] ??= ind;
}
save("ratios", ratios);

save("shops", shops);
save("products", products);
save("offers", offers);
save("coupons", coupons);
save("images", images);
save("runs", runs);
save("meta", { exported_at: new Date().toISOString() });
console.log(`export : ${shops.length} shops, ${products.length} produits, ${offers.length} offres en stock, ${coupons.length} coupons, ${Object.keys(contentByProduct).length} fiches rédigées, ${stores.length} magasins, ${Object.keys(contentPages).length} pages rédigées, ${variants.length} variantes, ${gallery.length} photos de galerie, ${history.length} relevés de prix, ${Object.keys(ratios).length} ratios`);
