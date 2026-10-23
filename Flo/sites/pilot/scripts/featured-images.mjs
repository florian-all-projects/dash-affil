// Choisit les produits mis en avant (plus fortes remises + produits les plus distribués par catégorie),
// prépare les prompts d'images, lance la génération (gen-images.py) puis enregistre les images dans D1 (product_images).
// Le prompt ne reprend jamais le nom du produit (marques) : il décrit seulement la forme du produit.
// Prérequis : node scripts/export-data.mjs déjà lancé ; CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, OPENAI_API_KEY dans l'environnement.
// Usage : node scripts/featured-images.mjs [max=30] [--dry]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DB_ID = "b1792254-2898-4c6b-8175-4a7ad127d183";
const MODEL = "gpt-image-1.5";
const MAX = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 30);
const DRY = process.argv.includes("--dry");
const { CLOUDFLARE_API_TOKEN: TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT } = process.env;

const load = (n) => JSON.parse(readFileSync(new URL(`../src/data/generated/${n}.json`, import.meta.url)));
const products = load("products");
const offers = load("offers");
const existing = new Set(load("images").map((i) => i.product_id));

// Agrégats par produit : nb de shops distincts, prix mini, remise affichée
const agg = new Map();
for (const o of offers) {
  const a = agg.get(o.product_id) ?? { shops: new Set(), from: Infinity, discount: 0 };
  a.shops.add(o.shop_id);
  if (o.price_cents < a.from) {
    a.from = o.price_cents;
    a.discount = o.compare_at_cents > o.price_cents ? Math.round((1 - o.price_cents / o.compare_at_cents) * 100) : 0;
  }
  agg.set(o.product_id, a);
}
const list = products.filter((p) => agg.has(p.id)).map((p) => ({ ...p, ...agg.get(p.id), n: agg.get(p.id).shops.size }));

const chosen = new Map();
const perPrompt = new Map();
const add = (p) => {
  if (chosen.size >= MAX || chosen.has(p.id)) return;
  const k = describe(p);
  if ((perPrompt.get(k) ?? 0) >= 2) return; // évite 4 visuels identiques (ex. 4 bombes de bain)
  perPrompt.set(k, (perPrompt.get(k) ?? 0) + 1);
  chosen.set(p.id, p);
};
// 1. Les remises de la page d'accueil (même règle que deals() dans catalog.ts)
list.filter((p) => p.discount >= 10).sort((a, b) => b.discount - a.discount).slice(0, 8).forEach(add);
// 2. Par catégorie, les produits vendus par le plus de shops, puis les moins chers
const CATS = ["flower", "edible", "concentrate", "vape", "cbd", "seed", "accessory"];
// Shops « à vie » d'abord (commission récurrente), puis le nombre de shops, puis le prix
const lifetime = new Set(load("shops").filter((s) => s.lifetime).map((s) => s.id));
const score = (p) => [...p.shops].some((id) => lifetime.has(id)) ? 1 : 0;
const ranked = Object.fromEntries(CATS.map((c) => [c, list.filter((p) => p.category === c).sort((a, b) => score(b) - score(a) || b.n - a.n || a.from - b.from)]));
for (let round = 0; round < 60 && chosen.size < MAX; round++) {
  for (const c of CATS) if (ranked[c][round]) add(ranked[c][round]);
}

// Description visuelle déduite du nom et de la catégorie (jamais le nom lui-même)
function describe(p) {
  const n = p.name.toLowerCase();
  const has = (re) => re.test(n);
  switch (p.category) {
    case "flower": {
      const look = p.strain_type === "indica" ? "dense, deep green buds with purple hues and orange hairs"
        : p.strain_type === "sativa" ? "airy, light lime-green buds with long orange hairs"
        : "frosty green buds covered in sparkling trichomes";
      if (has(/pre-?roll|joint|cone|blunt/)) return "Three neatly rolled cannabis pre-rolls with twisted tips, lying side by side.";
      const qty = has(/ounce|oz|28 ?g|half|quarter|qp|lb|pound|mix and match/) ? "a generous pile of" : "three";
      return `Close-up of ${qty} dried cannabis flower ${look}, resting on the paper.`;
    }
    case "edible":
      if (has(/hot chocolate|coffee|tea|drink|soda|beverage|syrup|lemonade|shot/)) return "A plain unlabelled glass bottle of amber drink with condensation, beside a small cup.";
      if (has(/belt|sour|strip/)) return "A few sugar-coated sour candy belts, loosely curled.";
      if (has(/gumm|jell|bear|worm|ring|bomb/)) return "A small heap of colourful sugar-coated fruit gummies.";
      if (has(/chocolate|choco|bar/)) return "A plain unwrapped dark chocolate bar broken into squares, a few pieces scattered.";
      if (has(/cookie|biscuit/)) return "A stack of three homemade cookies.";
      if (has(/brownie/)) return "Two square fudge brownies.";
      if (has(/capsule|pill|tablet/)) return "A few amber softgel capsules.";
      if (has(/candy|lollipop|hard/)) return "A handful of translucent hard candies.";
      return "An assortment of small homemade sweets.";
    case "concentrate":
      if (has(/tincture|drops/)) return "A plain unlabelled amber glass dropper bottle of golden oil, dropper resting beside it.";
      if (has(/shatter/)) return "A thin glassy amber sheet of cannabis shatter, broken into shards.";
      if (has(/rosin|resin|badder|budder|wax/)) return "A small dab of golden creamy cannabis wax on a square of parchment.";
      if (has(/hash|kief/)) return "A few small blocks of dark brown hashish.";
      if (has(/diamond|thca|crystal/)) return "Clear crystalline cannabis diamonds glistening in golden sauce in a small glass jar.";
      if (has(/oil|distillate|syringe/)) return "A plain unlabelled glass syringe of golden cannabis oil.";
      return "A small dab of amber cannabis concentrate on parchment paper.";
    case "vape":
      if (has(/battery|charger|510 thread/)) return "A slim plain matte black vape battery pen with its short charging cable, no markings.";
      if (has(/liquid|e-?juice/)) return "A small plain unlabelled glass dropper bottle of clear golden e-liquid.";
      if (has(/disposable|pen/)) return "A sleek plain matte vape pen without markings.";
      return "A plain glass vape cartridge filled with golden oil, no markings.";
    case "cbd":
      if (has(/cream|balm|salve|lotion|topical/)) return "An open plain white jar of smooth balm.";
      if (has(/gumm/)) return "A small heap of pastel sugar-coated gummies next to a green hemp leaf.";
      if (has(/capsule|softgel/)) return "A few clear golden softgel capsules beside a small hemp leaf.";
      if (has(/bath|bomb/)) return "Two round pastel bath bombs.";
      if (has(/pet|dog|cat/)) return "A plain amber dropper bottle beside a few dog treats.";
      return "A plain unlabelled amber glass dropper bottle of golden oil beside a small hemp leaf.";
    case "seed":
      return "A small ceramic dish holding a dozen tiger-striped cannabis seeds, a few seeds scattered.";
    case "accessory":
      if (has(/grinder/)) return "A plain metal herb grinder, lid open.";
      if (has(/wrap/)) return "A few plain rolled hemp wrap leaves, one partly unrolled.";
      if (has(/paper|rolling|cone|raw |king size|slim|1 1\/4/)) return "A few plain unbleached rolling papers and pre-rolled empty cones.";
      if (has(/boveda|humid/)) return "A small plain white humidity pack beside a glass storage jar.";
      if (has(/bong|water pipe|bubbler/)) return "A plain clear glass water pipe.";
      if (has(/pipe/)) return "A small plain glass hand pipe.";
      if (has(/lighter/)) return "A plain matte lighter without markings.";
      if (has(/jar|stash|container/)) return "A plain glass storage jar with a wooden lid.";
      return "A plain cannabis accessory without markings.";
    default:
      return "A plain cannabis product without packaging.";
  }
}

const jobs = [...chosen.values()]
  .filter((p) => !existing.has(p.id))
  .map((p) => ({ id: p.id, slug: p.slug, name: p.name, category: p.category, out: `public/img/p/${p.slug}.webp`, prompt: describe(p), model: MODEL, quality: "medium" }));

console.log(`${chosen.size} produits retenus, ${jobs.length} images à générer`);
for (const j of jobs) console.log(`- [${j.category}] ${j.name} : ${j.prompt}`);
if (DRY || !jobs.length) process.exit(0);
if (!TOKEN || !ACCOUNT || !process.env.OPENAI_API_KEY) throw new Error("CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID et OPENAI_API_KEY requis");

const jobsFile = new URL("../.featured-jobs.json", import.meta.url);
writeFileSync(jobsFile, JSON.stringify(jobs));
execFileSync("python3", [new URL("./gen-images.py", import.meta.url).pathname, jobsFile.pathname], { stdio: "inherit", cwd: new URL("..", import.meta.url).pathname });

// Enregistre dans D1 les images effectivement produites
const done = jobs.filter((j) => existsSync(new URL(`../${j.out}`, import.meta.url)));
for (const j of done) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB_ID}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sql: `INSERT INTO product_images (product_id, position, path, model, prompt) VALUES (?, 1, ?, ?, ?)
            ON CONFLICT(product_id, position) DO UPDATE SET path = excluded.path, model = excluded.model, prompt = excluded.prompt`,
      params: [j.id, `/img/p/${j.slug}.webp`, j.model, j.prompt],
    }),
  });
  const r = await res.json();
  if (!r.success) console.error("D1", j.slug, JSON.stringify(r.errors));
}
console.log(`${done.length}/${jobs.length} images enregistrées dans D1`);
