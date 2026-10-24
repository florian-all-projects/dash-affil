// Génère le contenu éditorial (EN + FR) des pages accueil, catégories, provinces, villes et boutiques du site pilote,
// à partir des MÊMES faits que le site (src/lib/catalog.ts, src/lib/geo.ts), puis écrit un SQL d'upsert dans `content` (D1).
//
// Usage : npx tsx scripts/gen-page-content.ts --out <dossier> [--types home,category,province,city,shop] [--only clé1,clé2] [--force]
//         npx wrangler d1 execute cana-catalog --remote --yes --file <dossier>/pages-pilot.sql
// Variables : OPENAI_API_KEY (jamais commitée). Cache JSONL local : une page n'est régénérée que si ses faits changent.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CATEGORY_ORDER, CATEGORY_SLUGS, fmtPrice } from "../src/lib/i18n";
import { products, activeShops, categoryStats, productsByCategory, productsByShop, couponsForShop, byPopularity, deals } from "../src/lib/catalog";
import { PROVINCES, cities, stores, citiesOf, storesOf, provinceOf, nearby } from "../src/lib/geo";
import { SHOP_FACTS, SHOP_INTRO } from "../src/data/shops-content";

const argv = process.argv.slice(2);
const arg = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const OUT = arg("out");
const TYPES = (arg("types") ?? "home,category,province,city,shop").split(",");
const ONLY = arg("only")?.split(",") ?? null;
const FORCE = argv.includes("--force");
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.TEXT_MODEL || "gpt-4.1"; // pages peu nombreuses et à fort enjeu : modèle complet
if (!OUT || !KEY) throw new Error("--out et OPENAI_API_KEY requis");
mkdirSync(OUT, { recursive: true });

function fnv1a(s: string) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; }
const P = (c: number) => fmtPrice(c, "en");

const SYSTEM = `You write SEO landing pages for a Canadian cannabis price-comparison catalogue, in English AND native Canadian French.
The site: a mail-order cannabis catalogue that reads the menus of online dispensaries and seed banks every week and lists every product with the shops that sell it. Voice: a knowledgeable catalogue editor, concrete, plain, warm, a little dry. Short sentences mixed with longer ones. Specific numbers from FACTS.

Hard rules:
1. Use ONLY the facts in FACTS for anything specific (numbers, names, laws, prices, shops, stores). You may add common, uncontroversial general knowledge (how mail delivery works, what a category is, storage, responsible use), never invented specifics: no invented neighbourhoods, landmarks, delivery times, statistics, store hours, store descriptions or reviews.
2. Legal accuracy: online mail-order shops are NOT provincially licensed; never call them licensed, legal, authorized, regulated, « agréées » or « autorisées ». Say plainly that legal purchase is only through the provincial channel listed in FACTS, without moralizing. Licensed stores in FACTS are provincially authorized.
3. No health or medical claims.
4. No superlatives like "best", no "look no further", no exclamation marks, no emojis, no rhetorical questions in headings.
5. Do not write any price that is not in FACTS. Prices change weekly, so phrase them as "from $X this week".
6. Headings (h) are natural, keyword-rich and specific to the page (include the city/province/category/shop name), never generic like "Introduction" or "Conclusion".
7. French: natural Canadian French (« cannabis », « livraison », « boutique en ligne », « magasin », « comestibles », « vapoteuses », « graines »), French typography (space before ; : ? !). Not a literal translation of the English: same facts, own phrasing.
8. FAQ answers: 1 to 3 sentences, factual, from FACTS.

Return strict JSON: {"en": {"lead": string, "sections": [{"h": string, "p": string[]}], "faq": [{"q": string, "a": string}]}, "fr": {same shape}}`;

interface Job { type: string; key: string; brief: string; facts: Record<string, unknown> }
const jobs: Job[] = [];
const legal = (code: string) => {
  const p = provinceOf(code);
  return { province: p.name, provinceFr: p.nameFr, legalAge: p.age, possessionInPublic: "30 g of dried cannabis (federal limit)", publicUse: p.publicUse, homeGrow: p.homeGrow ? "allowed, up to 4 plants per household" : "not allowed", legalSalesChannel: p.retailer, legalSalesChannelFr: p.retailerFr };
};
const shopFacts = () => activeShops.map((s) => ({ name: s.name, products: productsByShop(s.slug).length, shipping: SHOP_FACTS[s.slug]?.shipping?.en ?? null, freeShipping: SHOP_FACTS[s.slug]?.freeShipping?.en ?? null, payment: SHOP_FACTS[s.slug]?.payment?.en ?? null }));
const catFacts = () => CATEGORY_ORDER.map((c) => ({ c, st: categoryStats(c) })).filter((x) => x.st).map(({ c, st }) => ({ category: CATEGORY_SLUGS[c].label.en, products: st!.count, shops: st!.shops, lowestPrice: P(st!.from) }));

if (TYPES.includes("home")) jobs.push({
  type: "home", key: "home",
  brief: `Home page. Main keyword EN: "buy weed online Canada" (also "online dispensary Canada", "weed price comparison"). FR: « acheter du cannabis en ligne au Canada » (aussi « comparateur cannabis », « boutique de cannabis en ligne »).
Lead: 40-60 words. 6 sections, each with 3 paragraphs of 3-4 sentences (about 170 words per section, 1000+ words per language): how buying weed online in Canada works with mail-order shops; how this catalogue compares prices and why it matters (same product, different prices); choosing a shop (catalogue size, free-shipping thresholds, payment methods from FACTS); delivery and packaging (Xpresspost etc. from FACTS); the law and the legal provincial channels (ages, 30 g, licensed stores count); categories and what to look for. FAQ: 8 questions.`,
  facts: { productsTracked: products.length, shops: shopFacts(), categories: catFacts(), licensedStoresInRegistries: stores.length, provinces: PROVINCES.map((p) => ({ name: p.name, legalAge: p.age, homeGrow: p.homeGrow })), dealsThisWeek: deals(240).length, update: "prices checked every week" },
});
if (TYPES.includes("category")) for (const c of CATEGORY_ORDER) {
  const st = categoryStats(c);
  if (!st) continue;
  const list = productsByCategory(c);
  const types = ["indica", "sativa", "hybrid"].map((t) => ({ type: t, products: list.filter((p) => p.strainType === t).length })).filter((x) => x.products);
  const weights = Object.entries(list.flatMap((p) => p.weights).reduce((a: Record<string, number>, w) => ((a[w] = (a[w] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
  const prices = list.map((p) => p.from).sort((a, b) => a - b);
  jobs.push({
    type: "category", key: c,
    brief: `Category page "${CATEGORY_SLUGS[c].label.en}". Main keyword EN: "buy ${CATEGORY_SLUGS[c].label.en.toLowerCase()} online Canada". FR: « acheter des ${CATEGORY_SLUGS[c].label.fr.toLowerCase()} en ligne au Canada ».
Lead: 35-55 words. 4 sections, each with 3 paragraphs of 3-4 sentences (about 160 words per section, 650+ words per language): what the category covers and its formats; how prices compare across shops (from FACTS: median, lowest, number of shops); how to choose (types, grades, potency, formats); ordering online and receiving it by mail, responsible use when relevant. FAQ: 6 questions.`,
    facts: { category: CATEGORY_SLUGS[c].label.en, categoryFr: CATEGORY_SLUGS[c].label.fr, products: st.count, shops: st.shops, lowestPrice: P(st.from), medianPrice: P(prices[Math.floor(prices.length / 2)]), types, commonFormats: weights, examples: [...list].sort(byPopularity).slice(0, 8).map((p) => p.name), productsSoldBySeveralShops: list.filter((p) => p.shopCount > 1).length },
  });
}
if (TYPES.includes("province")) for (const p of PROVINCES) {
  const cs = citiesOf(p.code);
  jobs.push({
    type: "province", key: p.code,
    brief: `Province page for ${p.name}. Main keywords EN: "buy weed online ${p.name}", "weed delivery ${p.name}", "is weed legal in ${p.name}". FR: « acheter du cannabis en ligne ${p.inFr} », « livraison cannabis ${p.inFr} ».
Lead: 40-60 words. 5 sections, each with 3 paragraphs of 3-4 sentences (about 160 words per section, 800+ words per language): the cannabis law in ${p.name} (age, public use, home growing, possession); where to buy legally in ${p.name} (provincial channel, licensed stores count and main cities); ordering online by mail from ${p.name} (how shops ship, what to check); prices this week (from FACTS); cities covered. FAQ: 7 questions (legal age, public use, home growing, online delivery, stores, possession, travelling with cannabis between provinces only as general federal info: no carrying across the border).`,
    facts: { ...legal(p.code), licensedStoresInRegistry: storesOf(p.code).length, citiesWithMostStores: cs.slice(0, 10).map((c) => ({ city: c.name, stores: c.stores.length })), onlineShopsDelivering: activeShops.length, productsAvailable: products.length, lowestPrices: catFacts().slice(0, 6) },
  });
}
if (TYPES.includes("city")) for (const c of cities) {
  const near = nearby(c, 6);
  jobs.push({
    type: "city", key: `${c.province}/${c.slug}`,
    brief: `City page for ${c.name}, ${provinceOf(c.province).name}. Main keywords EN: "weed delivery ${c.name}", "dispensary ${c.name}", "buy weed online ${c.name}". FR: « livraison cannabis ${c.nameFr} », « magasin de cannabis ${c.nameFr} ».
Lead: 35-55 words. 4 sections, each with 3 paragraphs of 3-4 sentences (about 140 words per section, 550+ words per language): getting weed delivered to ${c.name} by mail from online shops (what to check, free-shipping thresholds from FACTS); the licensed stores in ${c.name} (count, a few names exactly as given, the provincial channel); the rules that apply in ${c.name} (province facts); comparing prices before ordering (from FACTS). If storesInCity is 0, say no licensed store is located in the city in the registry and point to the provincial channel. FAQ: 6 questions specific to ${c.name}.`,
    facts: { city: c.name, cityFr: c.nameFr, ...legal(c.province), storesInCity: c.stores.length, someStoreNames: c.stores.slice(0, 6).map((s) => s.name), nearbyCities: near.map((n) => n.name), onlineShopsDelivering: activeShops.length, shopsFreeShipping: shopFacts().filter((s) => s.freeShipping).map((s) => `${s.name}: ${s.freeShipping}`), lowestPrices: catFacts().slice(0, 5) },
  });
}
if (TYPES.includes("shop")) for (const s of activeShops) {
  const list = productsByShop(s.slug);
  const own = (p: (typeof list)[number]) => p.offers.find((o) => o.shop.slug === s.slug)!.price;
  jobs.push({
    type: "shop", key: s.slug,
    brief: `Shop review page for ${s.name}. Main keywords EN: "${s.name} review", "${s.name} promo code". FR: « avis ${s.name} », « code promo ${s.name} ».
This is a fact-based review: no star rating, no customer testimonials, no claims about quality, speed or service that are not in FACTS. Lead: 35-55 words. 4 sections, each with 3 paragraphs of 3-4 sentences (about 150 words per section, 600+ words per language): what ${s.name} sells (catalogue by category); prices compared with other shops (from FACTS); delivery, payment and free shipping (only from FACTS, say when something is not published); who it suits and what to check before ordering. FAQ: 5 questions.`,
    facts: { shop: s.name, intro: SHOP_INTRO[s.slug]?.en ?? null, productsInStock: list.length, byCategory: CATEGORY_ORDER.map((c) => ({ category: CATEGORY_SLUGS[c].label.en, products: list.filter((p) => p.category === c).length })).filter((x) => x.products), priceRange: `${P(Math.min(...list.map(own)))} to ${P(Math.max(...list.map(own)))}`, cheapestShopFor: list.filter((p) => p.offers[0].shop.slug === s.slug).length, productsAlsoSoldElsewhere: list.filter((p) => p.shopCount > 1).length, shipping: SHOP_FACTS[s.slug]?.shipping?.en ?? "not published", freeShipping: SHOP_FACTS[s.slug]?.freeShipping?.en ?? "not published", payment: SHOP_FACTS[s.slug]?.payment?.en ?? "not published", promoCodes: couponsForShop(s.slug).map((c) => `${c.code}: ${c.description ?? ""}`), popular: [...list].sort(byPopularity).slice(0, 6).map((p) => p.name) },
  });
}

const cachePath = `${OUT}/pages-pilot.jsonl`;
const cache = new Map<string, any>();
if (existsSync(cachePath)) for (const l of readFileSync(cachePath, "utf8").split("\n")) if (l) { const r = JSON.parse(l); cache.set(`${r.type}:${r.key}`, r); }
const todo = jobs.filter((j) => (!ONLY || ONLY.includes(j.key)) && (FORCE || cache.get(`${j.type}:${j.key}`)?.hash !== fnv1a(j.brief + JSON.stringify(j.facts))));
console.log(`${jobs.length} pages, ${todo.length} à générer`);

let inTok = 0, outTok = 0;
async function gen(j: Job) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.7, response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `PAGE BRIEF:\n${j.brief}\n\nFACTS (JSON):\n${JSON.stringify(j.facts)}` }] }),
    });
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 2000 * attempt)); continue; }
    const out: any = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(out.error));
    inTok += out.usage.prompt_tokens; outTok += out.usage.completion_tokens;
    const body = JSON.parse(out.choices[0].message.content);
    for (const l of ["en", "fr"]) if (!body[l]?.lead || !Array.isArray(body[l].sections) || body[l].sections.length < 3 || !Array.isArray(body[l].faq)) throw new Error(`réponse ${l} incomplète`);
    return body;
  }
  throw new Error("trop de tentatives");
}
const queue = [...todo];
let done = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const j = queue.shift()!;
    try {
      const body = await gen(j);
      const row = { type: j.type, key: j.key, hash: fnv1a(j.brief + JSON.stringify(j.facts)), model: MODEL, en: body.en, fr: body.fr };
      appendFileSync(cachePath, JSON.stringify(row) + "\n");
      cache.set(`${j.type}:${j.key}`, row);
      if (++done % 25 === 0) console.log(`${done}/${todo.length}`);
    } catch (e) { console.error("échec", j.type, j.key, String(e).slice(0, 200)); }
  }
}));
console.log(`terminé : ${done}/${todo.length}, ${inTok} + ${outTok} jetons ≈ ${((inTok * 2 + outTok * 8) / 1e6).toFixed(2)} $`);

// SQL : une ligne par (page, langue) ; entity_id = empreinte numérique de « type:clé », la clé est gardée dans le corps
const esc = (s: string) => `'${s.replace(/'/g, "''")}'`;
const sql: string[] = [];
for (const r of cache.values()) for (const lang of ["en", "fr"]) {
  const body = JSON.stringify({ key: r.key, ...r[lang] });
  sql.push(`INSERT INTO content (entity_type, entity_id, site_id, lang, field, body, facts_hash, model) VALUES (${esc(r.type)}, ${fnv1a(`${r.type}:${r.key}`)}, (SELECT id FROM sites WHERE slug = 'pilot'), '${lang}', 'page', ${esc(body)}, '${r.hash}', ${esc(r.model)})
ON CONFLICT(entity_type, entity_id, site_id, lang, field) DO UPDATE SET body = excluded.body, facts_hash = excluded.facts_hash, model = excluded.model, created_at = strftime('%Y-%m-%dT%H:%M:%SZ','now');`);
}
writeFileSync(`${OUT}/pages-pilot.sql`, sql.join("\n") + "\n");
console.log(`SQL : ${OUT}/pages-pilot.sql (${sql.length} lignes)`);
