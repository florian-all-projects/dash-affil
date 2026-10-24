// Génère les guides (EN + FR) en BLOCS structurés (repères chiffrés, tableaux, étapes, comparatifs, listes à cocher,
// encadrés, graphiques) à partir des faits du catalogue et des sources citées, puis écrit un SQL d'upsert dans `content`.
//
// Usage : npx tsx scripts/gen-guides.ts --out <dossier> [--only weights,grades] [--force]
//         npx wrangler d1 execute cana-catalog --remote --yes --file <dossier>/guides-pilot.sql
// Variables : OPENAI_API_KEY (jamais commitée).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { GUIDES } from "../src/data/guides";
import { chartData, provinceRows, paymentRows, catalogueSize } from "../src/lib/guide-data";
import { fmtPrice } from "../src/lib/i18n";

const argv = process.argv.slice(2);
const arg = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const OUT = arg("out");
const ONLY = arg("only")?.split(",") ?? null;
const FORCE = argv.includes("--force");
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.TEXT_MODEL || "gpt-4.1";
if (!OUT || !KEY) throw new Error("--out et OPENAI_API_KEY requis");
mkdirSync(OUT, { recursive: true });
function fnv1a(s: string) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; }

const SYSTEM = `You write buying guides for Budboard, a Canadian cannabis price-comparison catalogue, in English AND native Canadian French.
Readers skim. Never write walls of text. Each guide is a sequence of designed BLOCKS, not an essay.

Block types (JSON objects in "blocks"):
- {"type":"keyfacts","items":[{"label":string,"value":string,"note":string|null}]}  3 or 4 short figures or facts.
- {"type":"section","h":string,"p":[string]}  at most 2 paragraphs of 2-4 sentences.
- {"type":"table","h":string,"head":[string],"rows":[[string]],"note":string|null}
- {"type":"steps","h":string,"items":[{"h":string,"p":string}]}  ONLY for a real sequence.
- {"type":"compare","h":string,"cols":[{"name":string,"points":[string]}]}  2 or 3 columns, 3-5 points each, same aspects in the same order.
- {"type":"checklist","h":string,"items":[string]}
- {"type":"callout","tone":"info"|"warn","text":string}
- {"type":"chart","id":string,"h":string,"caption":string}  id MUST be one of CHARTS; the site draws it from live data. Caption says what to notice, without exact prices.

Rules:
1. 9 to 14 blocks per language, starting with keyfacts. Mix block types; never two "section" blocks in a row. Include every chart id listed in CHARTS exactly once.
2. Specific facts (laws, figures, timings, shop terms) ONLY from FACTS. General, uncontroversial knowledge is fine. No invented statistics.
3. Chart data changes every week: NEVER quote a figure, ratio or percentage derived from FACTS.charts (no "a third less", no "$3/g"). Describe the trend in words ("much lower per gram", "the cheapest weights are the bulk ones") and point to the chart. Chart values are MEDIANS, never call them averages. Never write a year or date that is not in FACTS (the catalogue edition date is FACTS.edition).
4. No health or medical claims, no promises about effects. Effects vary from person to person.
5. Online mail-order shops are NOT provincially licensed: never call them licensed, legal, authorized, « agréées » or « autorisées ».
6. No "best", no exclamation marks, no emojis, no rhetorical headings. Headings are specific and keyword-rich.
7. French: natural Canadian French, French typography (space before ; : ? !), own phrasing (not a literal translation).
8. Attribute each fact to the source named in FACTS (for example the edibles timings and the 2.5 mg starting dose come from the CCSA, the 10 mg package limit from Health Canada). Never use the em dash character; use a comma, a colon or parentheses.
9. Steps items: do not number the headings yourself (the site numbers them).
10. Also return: "title" (≤ 60 characters, includes the main keyword), "meta" (140-155 characters), "h1", "lead" (35-55 words), "faq" (4-6 Q/A, answers 1-3 sentences).

Return strict JSON: {"en": {"title","meta","h1","lead","blocks":[...],"faq":[...]}, "fr": {same shape}}`;

const P = (c: number) => fmtPrice(c, "en");
const factsFor = (g: (typeof GUIDES)[number]) => ({
  edition: "weekly catalogue edition, updated every week",
  catalogue: catalogueSize(),
  charts: Object.fromEntries(g.charts.map((id) => [id, id === "province_rules" || id === "province_homegrow" ? provinceRows() : id === "payment_by_shop" ? paymentRows() : chartData(id).map((r: any) => ({ ...r, value: /ppg|per10|price|shipping/.test(id) ? P(r.value) : r.value }))])),
  sources: g.sources,
  ...(g.key === "edibles" ? { ccsa: { onset: "30 minutes to 2 hours", peak: "about 4 hours", duration: "up to 12 hours, residual effects up to 24 hours", startLow: "2.5 mg THC or less", noAlcohol: "do not mix with alcohol or other substances", storage: "store locked, away from children and pets" }, healthCanada: { legalPackageLimit: "10 mg THC per package of edible cannabis in the legal market" } } : {}),
  ...(g.key === "laws" || g.key === "seeds" ? { federal: { publicPossession: "30 g dried cannabis or equivalent, for adults", homeGrowFederal: "up to 4 plants per household, where the province allows it", border: "taking cannabis across the Canadian border is illegal, in either direction" }, quebec: { age: 21, publicPossession: "30 g", homePossession: "150 g per residence", homeGrow: "prohibited, including possessing a plant", legalSeller: "SQDC only" }, manitoba: { homeGrow: "allowed since 1 May 2025, up to 4 plants per household, indoors, 19+" } } : {}),
});

const cachePath = `${OUT}/guides-pilot.jsonl`;
const cache = new Map<string, any>();
if (existsSync(cachePath)) for (const l of readFileSync(cachePath, "utf8").split("\n")) if (l) { const r = JSON.parse(l); cache.set(r.key, r); }
const jobs = GUIDES.map((g) => ({ g, facts: factsFor(g) })).map((j) => ({ ...j, hash: fnv1a(j.g.brief + JSON.stringify(j.facts)) }));
const todo = jobs.filter((j) => (!ONLY || ONLY.includes(j.g.key)) && (FORCE || cache.get(j.g.key)?.hash !== j.hash));
console.log(`${jobs.length} guides, ${todo.length} à générer`);

let inTok = 0, outTok = 0;
async function gen(j: (typeof jobs)[number]) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.6, response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `GUIDE: ${j.g.key}\nMAIN KEYWORD EN: ${j.g.keyword.en}\nMAIN KEYWORD FR: ${j.g.keyword.fr}\nBRIEF: ${j.g.brief}\nCHARTS: ${JSON.stringify(j.g.charts)}\n\nFACTS (JSON):\n${JSON.stringify(j.facts)}` }] }),
    });
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 2000 * attempt)); continue; }
    const out: any = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(out.error));
    inTok += out.usage.prompt_tokens; outTok += out.usage.completion_tokens;
    // Pas de tiret cadratin (préférence de Florian) : remplacé par une virgule
    const body = JSON.parse(out.choices[0].message.content.replace(/\s*\u2014\s*/g, ", "));
    for (const l of ["en", "fr"]) {
      const b = body[l];
      if (!b?.h1 || !Array.isArray(b.blocks) || b.blocks.length < 7 || !Array.isArray(b.faq)) throw new Error(`réponse ${l} incomplète`);
      b.blocks = b.blocks.filter((x: any) => x.type !== "chart" || j.g.charts.includes(x.id));
    }
    return body;
  }
  throw new Error("trop de tentatives");
}
await Promise.all(todo.map(async (j) => {
  try {
    const body = await gen(j);
    const row = { key: j.g.key, hash: j.hash, model: MODEL, en: body.en, fr: body.fr };
    appendFileSync(cachePath, JSON.stringify(row) + "\n");
    cache.set(j.g.key, row);
    console.log("ok", j.g.key);
  } catch (e) { console.error("échec", j.g.key, String(e).slice(0, 200)); }
}));
const [pin, pout] = MODEL.includes("mini") ? [0.4, 1.6] : [2, 8];
console.log(`${inTok} + ${outTok} jetons ≈ ${((inTok * pin + outTok * pout) / 1e6).toFixed(2)} $`);

const esc = (s: string) => `'${s.replace(/'/g, "''")}'`;
const sql: string[] = [];
for (const r of cache.values()) for (const lang of ["en", "fr"]) {
  const body = JSON.stringify({ key: r.key, ...r[lang] });
  sql.push(`INSERT INTO content (entity_type, entity_id, site_id, lang, field, body, facts_hash, model) VALUES ('guide', ${fnv1a(`guide:${r.key}`)}, (SELECT id FROM sites WHERE slug = 'pilot'), '${lang}', 'page', ${esc(body)}, '${r.hash}', ${esc(r.model)})
ON CONFLICT(entity_type, entity_id, site_id, lang, field) DO UPDATE SET body = excluded.body, facts_hash = excluded.facts_hash, model = excluded.model, created_at = strftime('%Y-%m-%dT%H:%M:%SZ','now');`);
}
writeFileSync(`${OUT}/guides-pilot.sql`, sql.join("\n") + "\n");
console.log(`SQL : ${OUT}/guides-pilot.sql (${sql.length} lignes)`);
