// Génère le contenu éditorial des fiches produits (EN + FR) pour un site du réseau, à partir des faits collectés
// (nom, catégorie, type, formats, description source du shop). Écrit un cache JSONL local (reprise possible),
// puis un fichier SQL d'upsert dans la table `content` (D1) à appliquer avec wrangler.
//
// Usage :
//   node gen/product-content.mjs --site pilot --out <dossier> [--limit N] [--only slug1,slug2] [--concurrency 8]
//   npx wrangler d1 execute cana-catalog --remote --yes --file <dossier>/content-<site>.sql
// Variables : OPENAI_API_KEY, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID (jamais commitées).
// Ne régénère que si les faits ont changé (facts_hash) : le coût reste borné d'une semaine à l'autre.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith("--") ? [...a, [x.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]] : a), []));
const SITE = args.site || "pilot";
const OUT = args.out;
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const ONLY = args.only ? String(args.only).split(",") : null;
const CONC = Number(args.concurrency || 8);
const MODEL = process.env.TEXT_MODEL || "gpt-4.1-mini";
const DB_ID = "b1792254-2898-4c6b-8175-4a7ad127d183";
const { OPENAI_API_KEY: KEY, CLOUDFLARE_API_TOKEN: TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT } = process.env;
if (!OUT || !KEY || !TOKEN || !ACCOUNT) throw new Error("--out, OPENAI_API_KEY, CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID requis");
mkdirSync(OUT, { recursive: true });

async function q(sql, params = []) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB_ID}/query`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ sql, params }),
  });
  const j = await res.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return j.result[0].results;
}
function fnv1a(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }

// Identité éditoriale par site (contenu unique par site : PLAN §7)
const VOICES = {
  pilot: `The site is a Canadian mail-order cannabis catalogue and price comparator: it reads every online shop's menu each week and lists each product with the shops that sell it. Voice: a knowledgeable catalogue editor. Concrete, plain, warm, a little dry. Describes products the way a good mail-order catalogue does: what it is, what it looks/smells/tastes like, what the format is good for, what to check before ordering.`,
};
const VOICE = VOICES[SITE];
if (!VOICE) throw new Error(`voix inconnue pour le site ${SITE}`);

const SYSTEM = `You write product pages for a cannabis price-comparison catalogue in Canada, in English AND native Canadian French.
${VOICE}

Hard rules (never break them):
1. Facts about THIS product come ONLY from SOURCE and FACTS. Never invent THC/CBD figures, lineage, breeder, awards, lab results, terpenes, effects, flowering time or yield. If something is not in SOURCE, leave the field null / empty.
   You MAY add common, uncontroversial background about the category, clearly as general information (e.g. what the AAAA grading used by Canadian online shops means, how edibles are digested, what a 510 thread is, how to store flower, feminized vs autoflower seeds). Never present it as a fact about this specific product.
2. No medical or health claims: never say a product treats, cures, relieves or helps with pain, anxiety, insomnia, inflammation, depression or any condition, even if SOURCE does. You may report sensory notes and the general character ("calming evening strain", "uplifting") as how the strain is usually described.
3. Do not name the website, any online shop, any price, discount, shipping time or promo code (they are displayed live elsewhere on the page).
   Never describe online shops as licensed, authorized, legal, regulated or « agréés » / « autorisés » (they are mail-order shops, not provincially licensed retailers). Say "online shops" / « boutiques en ligne ».
4. Do not copy sentences from SOURCE: rewrite everything in your own words. No superlatives like "best in Canada", no "look no further", no exclamation marks, no emojis.
5. Write the product name exactly as given at least twice in each language (headings count).
6. Edibles, drinks, tinctures, concentrates and vapes: include one short, neutral responsible-use line (e.g. edibles take 30 minutes to 2 hours to take effect, start with a small amount). Seeds: say that home growing rules depend on the province.
7. French: written natively for Quebec / Canadian French readers (not a literal translation), with « cannabis », « fleur », « comestible », « vapoteuse », « graines ». Use non-breaking-space-free French punctuation with spaces before ; : ? ! as in standard French typography.

Length per language: every section has exactly 2 paragraphs of 3-4 sentences (about 80-110 words per section, so 320-440 words in total). When SOURCE is thin, keep 2 paragraphs per section but lean on the background knowledge from rule 1, never on empty filler.
Sections (4, in this spirit, headings phrased naturally and varied, including the product name or type):
 a) what the product is (type, genetics or composition, look),
 b) aroma, taste, texture or feel, and how it is usually described,
 c) how it is used or grown, storage, responsible use when relevant,
 d) what to check before ordering it online in Canada (formats, grade or strength, comparing shops' prices and formats, mail delivery, legal age and provincial rules) without naming shops or prices.

Return strict JSON:
{
 "facts": {"thc": string|null, "cbd": string|null, "lineage": string|null, "grade": string|null, "brand": string|null,
           "effects": string[], "flavors": string[], "terpenes": string[], "flowering_time": string|null, "yield": string|null},
 "en": {"meta": string (140-155 chars, includes the product name and "Canada"),
        "lead": string (one or two sentences, max 45 words),
        "sections": [{"h": string, "p": string[]}] (exactly 4 sections),
        "faq": [{"q": string, "a": string}] (3 or 4 questions a buyer would search for, answered only from the facts)},
 "fr": { same shape as "en" }
}
Lists ("effects", "flavors", "terpenes") are short English words from SOURCE only (max 5 each).`;

const CAT_HINT = {
  flower: "Dried cannabis flower (buds). Cover look, aroma and taste, the strain's character and typical time of day, how to store flower.",
  edible: "Cannabis edible. Cover what it is, taste and texture, dose per piece if SOURCE gives it, onset time and starting low.",
  concentrate: "Cannabis concentrate (shatter, hash, rosin, oil, tincture...). Cover texture and consistency, how it is usually consumed, potency handling.",
  vape: "Vape cartridge, disposable pen or vape hardware. Cover what is inside (if SOURCE says), compatibility (510 thread...), flavour, battery/charging if hardware.",
  cbd: "CBD product (oil, cream, capsule, gummy, pet product...). Cover format, CBD strength if given, how it is usually taken or applied, no health claims.",
  seed: "Cannabis seeds for home growing. Cover genetics, feminized/autoflower, flowering time and yield if given, indoor/outdoor suitability, Canadian climate if SOURCE mentions it.",
  accessory: "Cannabis accessory (papers, wraps, grinder, storage...). Cover material, size, what it is for, compatibility.",
  other: "Cannabis product. Describe plainly from SOURCE.",
};

// 1. Faits par produit : nom, catégorie, type, formats, description source la plus longue parmi les offres en stock
const rows = await q(`
  SELECT p.id, p.slug, p.name, p.category, p.strain_type, p.weight,
         (SELECT o2.description_src FROM product_offers o2 WHERE o2.product_id = p.id AND o2.in_stock = 1
          ORDER BY length(coalesce(o2.description_src,'')) DESC LIMIT 1) AS src
  FROM products p
  WHERE p.status = 'active' AND EXISTS (SELECT 1 FROM product_offers o WHERE o.product_id = p.id AND o.in_stock = 1 AND o.price_cents > 0)
  ORDER BY p.id`);
const site = (await q("SELECT id FROM sites WHERE slug = ?", [SITE]))[0];
if (!site) throw new Error(`site ${SITE} absent de la table sites`);
const existing = new Map((await q("SELECT entity_id, facts_hash FROM content WHERE entity_type = 'product' AND site_id = ? AND lang = 'en' AND field = 'page'", [site.id])).map((r) => [r.entity_id, r.facts_hash]));

const cachePath = `${OUT}/products-${SITE}.jsonl`;
const cache = new Map();
if (existsSync(cachePath)) for (const l of readFileSync(cachePath, "utf8").split("\n")) if (l) { const r = JSON.parse(l); cache.set(r.id, r); }

const todo = [];
for (const r of rows) {
  if (ONLY && !ONLY.includes(r.slug)) continue;
  const src = (r.src || "").slice(0, 3500);
  const hash = fnv1a([r.name, r.category, r.strain_type, r.weight, src].join("|"));
  if (existing.get(r.id) === hash) continue;
  if (cache.get(r.id)?.hash === hash) continue;
  todo.push({ ...r, src, hash });
  if (todo.length >= LIMIT) break;
}
console.log(`${rows.length} produits, ${todo.length} à générer (site ${SITE}, modèle ${MODEL})`);

let inTok = 0, outTok = 0, done = 0, failed = 0;
async function gen(p) {
  const user = `PRODUCT NAME: ${p.name}
CATEGORY: ${p.category} — ${CAT_HINT[p.category] ?? CAT_HINT.other}
TYPE: ${p.strain_type ?? "unknown"}
FORMATS: ${p.weight ? p.weight.split("|").join(", ") : "not listed"}
SOURCE (shop description, may be marketing, may be empty):
"""
${p.src || "(empty)"}
"""`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.7, response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }] }),
    });
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 2000 * attempt)); continue; }
    const j = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(j.error));
    inTok += j.usage.prompt_tokens; outTok += j.usage.completion_tokens;
    const out = JSON.parse(j.choices[0].message.content);
    for (const l of ["en", "fr"]) {
      const x = out[l];
      if (!x?.meta || !x?.lead || !Array.isArray(x.sections) || x.sections.length < 3 || !Array.isArray(x.faq)) throw new Error(`réponse ${l} incomplète`);
    }
    return out;
  }
  throw new Error("trop de tentatives");
}

const queue = [...todo];
async function worker() {
  while (queue.length) {
    const p = queue.shift();
    try {
      const out = await gen(p);
      appendFileSync(cachePath, JSON.stringify({ id: p.id, slug: p.slug, hash: p.hash, model: MODEL, ...out }) + "\n");
      cache.set(p.id, { id: p.id, hash: p.hash, model: MODEL, ...out });
      done++;
      if (done % 50 === 0) console.log(`${done}/${todo.length} (≈ ${((inTok * 0.4 + outTok * 1.6) / 1e6).toFixed(2)} $)`);
    } catch (e) { failed++; console.error("échec", p.slug, String(e).slice(0, 200)); }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
console.log(`terminé : ${done} générés, ${failed} échecs, ${inTok} + ${outTok} jetons ≈ ${((inTok * 0.4 + outTok * 1.6) / 1e6).toFixed(2)} $`);

// 2. SQL d'upsert (une ligne « facts » + une ligne « page » par langue)
const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sql = [];
for (const r of cache.values()) {
  const vals = [["xx", "facts", r.facts], ["en", "page", r.en], ["fr", "page", r.fr]];
  for (const [lang, field, body] of vals) {
    sql.push(`INSERT INTO content (entity_type, entity_id, site_id, lang, field, body, facts_hash, model) VALUES ('product', ${r.id}, ${site.id}, '${lang}', '${field}', ${esc(JSON.stringify(body))}, '${r.hash}', ${esc(r.model)})
ON CONFLICT(entity_type, entity_id, site_id, lang, field) DO UPDATE SET body = excluded.body, facts_hash = excluded.facts_hash, model = excluded.model, created_at = strftime('%Y-%m-%dT%H:%M:%SZ','now');`);
  }
}
writeFileSync(`${OUT}/content-${SITE}.sql`, sql.join("\n") + "\n");
console.log(`SQL : ${OUT}/content-${SITE}.sql (${sql.length} lignes)`);
