// Réapplique les règles d'exclusion et de catégorie de normalize.ts au catalogue déjà en base (D1), sans attendre le cycle suivant.
// Usage : npx tsx scripts/reapply-rules.ts [--apply]   (sans --apply : affiche seulement les changements)
import { categorize, isExcluded } from "../src/normalize";

const DB = "b1792254-2898-4c6b-8175-4a7ad127d183";
const { CLOUDFLARE_API_TOKEN: T, CLOUDFLARE_ACCOUNT_ID: A } = process.env;
async function q(sql: string, params: unknown[] = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${A}/d1/database/${DB}/query`, {
    method: "POST", headers: { Authorization: `Bearer ${T}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params }),
  });
  const j: any = await r.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return j.result[0].results as any[];
}
const apply = process.argv.includes("--apply");
const rows = await q("SELECT id, name, category FROM products WHERE status = 'active'");
const excl = rows.filter((p) => isExcluded(p.name, []));
const recat = rows.filter((p) => p.category === "other" && !isExcluded(p.name, [])).map((p) => ({ ...p, to: categorize(p.name, [], "MOM") })).filter((p) => p.to !== "other");
console.log(`${excl.length} produits hors périmètre :`); excl.forEach((p) => console.log("  -", p.name));
console.log(`${recat.length} produits recatégorisés :`); recat.forEach((p) => console.log(`  - ${p.name} : other → ${p.to}`));
if (apply) {
  for (const p of excl) await q("UPDATE products SET status = 'excluded' WHERE id = ?", [p.id]);
  for (const p of recat) await q("UPDATE products SET category = ? WHERE id = ?", [p.to, p.id]);
  console.log("appliqué");
}
