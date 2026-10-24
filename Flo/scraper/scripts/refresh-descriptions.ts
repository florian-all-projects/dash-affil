// Relit les descriptions complètes des shops WooCommerce depuis la Store API et écrit un fichier SQL
// (UPDATE product_offers SET description_src = ...) à appliquer avec : npx wrangler d1 execute cana-catalog --remote --file <sortie>
// À lancer depuis une machine qui joint les shops (pas de limite de CPU, contrairement au Worker gratuit).
// Usage : npx tsx scripts/refresh-descriptions.ts <sortie.sql> [slug...]
import { writeFileSync } from "node:fs";
import { mapWooProduct, type WooProduct } from "../src/woo";

const SHOPS: Record<string, { id: number; domain: string; category: string }> = {
  bmwo: { id: 1, domain: "buymyweedonline.cc", category: "MOM" },
  getkush: { id: 2, domain: "getkush.cc", category: "MOM" },
  ganjawest: { id: 3, domain: "ganjawest.co", category: "MOM" },
  lowpricebud: { id: 4, domain: "lowpricebud.co", category: "MOM" },
  thehighclub: { id: 5, domain: "thehighclub.biz", category: "MOM" },
  chronicfarms: { id: 6, domain: "chronicfarms.cc", category: "MOM" },
  cbdmagic: { id: 7, domain: "cbdmagic.co", category: "CBD" },
  cbd2heal: { id: 8, domain: "cbd2heal.ca", category: "CBD" },
  cbd2go: { id: 9, domain: "cbd2go.co", category: "CBD" },
};
const [out, ...only] = process.argv.slice(2);
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lines: string[] = [];
for (const [slug, s] of Object.entries(SHOPS)) {
  if (only.length && !only.includes(slug)) continue;
  let n = 0;
  for (let page = 1; page < 100; page++) {
    const res = await fetch(`https://${s.domain}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BudboardBot/1.0; price comparison)" },
    });
    if (!res.ok) { console.error(slug, page, res.status); break; }
    const items = (await res.json()) as WooProduct[];
    for (const p of items) {
      const o = mapWooProduct(p, s.category);
      if (!o || !o.descriptionSrc) continue;
      lines.push(`UPDATE product_offers SET description_src = ${q(o.descriptionSrc)} WHERE shop_id = ${s.id} AND source_id = ${q(o.sourceId)};`);
      n++;
    }
    const total = Number(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= total || !items.length) break;
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log(slug, n);
}
writeFileSync(out, lines.join("\n") + "\n");
console.log(`${lines.length} mises à jour écrites dans ${out}`);
