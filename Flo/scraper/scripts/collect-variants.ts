// Relève, sur la fiche de chaque offre WooCommerce en stock, les VARIANTES (format, prix, prix habituel, stock)
// publiées dans l'attribut data-product_variations, et la GALERIE de photos (data-large_image).
// Sert aux fiches produits : prix par format, prix au gramme, meilleur format, galerie.
// À lancer depuis une machine qui joint les shops (le Worker gratuit n'a pas le CPU pour lire ~4 000 pages).
//
// Usage : npx tsx scripts/collect-variants.ts <sortie.sql> [--limit N] [--shop slug] [--skip <sql d'une collecte interrompue>]
//         npx wrangler d1 execute cana-catalog --remote --yes --file <sortie.sql>
import { writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { parseFormat } from "../src/formats";
import { decodeEntities } from "../src/normalize";

const DB = "b1792254-2898-4c6b-8175-4a7ad127d183";
const { CLOUDFLARE_API_TOKEN: T, CLOUDFLARE_ACCOUNT_ID: A } = process.env;
const argv = process.argv.slice(2);
const OUT = argv[0];
const LIMIT = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
const ONLY = argv.includes("--shop") ? argv[argv.indexOf("--shop") + 1] : null;
// --recheck-grams 448,224 : ne relit que les offres qui ont une variante de ces poids (correction d'un parseur)
const RECHECK = argv.includes("--recheck-grams") ? argv[argv.indexOf("--recheck-grams") + 1].split(",").map(Number) : null;
// --skip <fichier.sql> : reprend une collecte interrompue (ignore les offres déjà présentes dans ce SQL)
const SKIP = argv.includes("--skip") ? new Set([...readFileSync(argv[argv.indexOf("--skip") + 1], "utf8").matchAll(/WHERE offer_id = (\d+);/g)].map((m) => Number(m[1]))) : new Set<number>();
if (!OUT || !T || !A) throw new Error("usage : collect-variants.ts <sortie.sql> ; CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID requis");

async function q(sql: string, params: unknown[] = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${A}/d1/database/${DB}/query`, {
    method: "POST", headers: { Authorization: `Bearer ${T}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params }),
  });
  const j: any = await r.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return j.result[0].results as any[];
}


const offers = await q(
  `SELECT o.id, o.product_url, s.slug, s.domain FROM product_offers o JOIN shops s ON s.id = o.shop_id
   WHERE o.in_stock = 1 AND s.status = 'active' AND s.platform = 'woocommerce' ${ONLY ? "AND s.slug = ?" : ""}
   ${RECHECK ? `AND o.id IN (SELECT offer_id FROM offer_variants WHERE grams IN (${RECHECK.join(",")}))` : ""} ORDER BY o.id`,
  ONLY ? [ONLY] : [],
);
const byHost = new Map<string, any[]>();
for (const o of offers.filter((x) => !SKIP.has(x.id)).slice(0, LIMIT)) (byHost.get(o.domain) ?? byHost.set(o.domain, []).get(o.domain)!).push(o);
console.log(`${Math.min(offers.length, LIMIT)} offres sur ${byHost.size} shops`);

const esc = (v: unknown) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
writeFileSync(OUT, "");
const sql = { push: (line: string) => appendFileSync(OUT, line + "\n") };
[
  `CREATE TABLE IF NOT EXISTS offer_variants (offer_id INTEGER NOT NULL REFERENCES product_offers(id) ON DELETE CASCADE, label TEXT NOT NULL, grams REAL, ml REAL, mg REAL, price_cents INTEGER, regular_cents INTEGER, in_stock INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')), PRIMARY KEY (offer_id, label));`,
  `CREATE TABLE IF NOT EXISTS offer_images (offer_id INTEGER NOT NULL REFERENCES product_offers(id) ON DELETE CASCADE, position INTEGER NOT NULL, url TEXT NOT NULL, PRIMARY KEY (offer_id, position));`,
].forEach((l) => sql.push(l));
let pages = 0, withVariants = 0, variantsN = 0, imagesN = 0, failed = 0;

async function handle(o: any) {
  const res = await fetch(o.product_url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BudboardBot/1.0; price comparison)" } });
  if (!res.ok) { failed++; return; }
  let html = await res.text();
  // On ne garde que les morceaux utiles (évite de retenir ~4 000 pages de 500 ko en mémoire via les sous-chaînes)
  const galleryHtml = [...html.matchAll(/data-large_image="([^"]+)"/g)].map((m) => Buffer.from(m[1]).toString()).join("\n");
  const varMatch = html.match(/data-product_variations="([^"]*)"/);
  const varRaw = varMatch ? " " + Buffer.from(varMatch[1]).toString() : null;
  html = "";
  pages++;
  // Galerie : grandes images de la fiche (ordre d'affichage), sans doublon
  const imgs = [...new Set(galleryHtml.split("\n").filter(Boolean).map((u) => decodeEntities(u)))].slice(0, 6);
  if (imgs.length) {
    sql.push(`DELETE FROM offer_images WHERE offer_id = ${o.id};`);
    imgs.forEach((u, i) => sql.push(`INSERT INTO offer_images (offer_id, position, url) VALUES (${o.id}, ${i}, ${esc(u)});`));
    imagesN += imgs.length;
  }
  if (!varRaw) return;
  const raw = decodeEntities(varRaw.slice(1));
  if (raw === "false") return; // variantes chargées en AJAX (rare) : ignorées
  let vars: any[];
  try { vars = JSON.parse(raw); } catch { return; }
  const rows = new Map<string, { grams: number | null; ml: number | null; mg: number | null; price: number | null; regular: number | null; stock: boolean }>();
  for (const v of vars) {
    const entries = Object.entries(v.attributes ?? {}) as Array<[string, string]>;
    if (!entries.length) continue;
    // Plusieurs attributs (ex. poids + saveur) : le libellé les réunit, le poids vient de l'attribut qui en contient un
    const parsed = entries.map(([k, val]) => parseFormat(String(val || "any"), k));
    const weight = parsed.find((p) => p.grams !== null || p.ml !== null);
    const dose = parsed.find((p) => p.mg !== null);
    const label = parsed.map((p) => p.label).join(" / ");
    const price = Number(v.display_price), regular = Number(v.display_regular_price);
    rows.set(label, {
      grams: weight?.grams ?? null, ml: weight?.ml ?? null, mg: dose?.mg ?? null,
      price: Number.isFinite(price) && price > 0 ? Math.round(price * 100) : null,
      regular: Number.isFinite(regular) && regular > price ? Math.round(regular * 100) : null,
      stock: v.is_in_stock !== false,
    });
  }
  if (!rows.size) return;
  withVariants++;
  sql.push(`DELETE FROM offer_variants WHERE offer_id = ${o.id};`);
  for (const [label, r] of rows) {
    sql.push(`INSERT INTO offer_variants (offer_id, label, grams, ml, mg, price_cents, regular_cents, in_stock) VALUES (${o.id}, ${esc(label)}, ${esc(r.grams)}, ${esc(r.ml)}, ${esc(r.mg)}, ${esc(r.price)}, ${esc(r.regular)}, ${r.stock ? 1 : 0});`);
    variantsN++;
  }
}

// Un fil par shop (politesse : une requête à la fois par site, 1 s d'écart), les shops en parallèle
await Promise.all([...byHost.values()].map(async (list) => {
  for (const o of list) {
    try { await handle(o); } catch { failed++; }
    await new Promise((r) => setTimeout(r, 1000));
    if ((pages + failed) % 100 === 0) console.log(`${pages + failed}/${Math.min(offers.length, LIMIT)} pages lues`);
  }
}));
console.log(`${pages} fiches lues (${failed} échecs), ${withVariants} avec variantes (${variantsN} variantes), ${imagesN} photos → ${OUT}`);
