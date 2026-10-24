// Passe de conformité sur les fiches produits générées : repère les allégations de santé (douleur, anxiété, sommeil,
// inflammation…) hors nom officiel du produit, et fait réécrire ces fiches par un modèle plus strict.
// La version corrigée est ajoutée au cache JSONL (la dernière ligne d'un produit l'emporte), puis le SQL est régénéré
// avec gen/product-content.mjs (relancé sans rien à générer).
//
// Usage : node gen/compliance-pass.mjs --cache <dossier>/products-pilot.jsonl [--dry]
import { appendFileSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
const CACHE = args[args.indexOf("--cache") + 1];
const DRY = args.includes("--dry");
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.FIX_MODEL || "gpt-4.1";
if (!CACHE || (!DRY && !KEY)) throw new Error("--cache et OPENAI_API_KEY requis");

const CLAIM = /stress relief|pain relief|\brelieve\w*|\breliev\w*|\banxiety\b|\banxious\b|insomnia|sleep disorder|inflammat\w*|anti-inflammatory|\bpain\b|\baches?\b|\baching\b|soulag\w*|douleurs?|anxiété|anxieu\w*|insomnie|troubles? du sommeil|inflammat\w*|anti-inflammatoire|therapeut\w*|thérapeut\w*|medicinal|médicina\w*|guérison|\bheal(s|ing)?\b(?! salve)|guéri\w*/i;

const rows = new Map();
for (const l of readFileSync(CACHE, "utf8").split("\n")) if (l) { const r = JSON.parse(l); rows.set(r.id, r); }

function flagged(r) {
  // Les mots du nom officiel du produit (ex. « Pain Killer Relief Cream ») sont tolérés : on les retire avant le test
  const name = (r.en.sections[0]?.h ?? "") + " " + r.slug.replace(/-/g, " ");
  const strip = (t) => t.replace(new RegExp(r.slug.split("-").filter((w) => w.length > 3).map((w) => `\\b${w}\\b`).join("|") || "$^", "gi"), "");
  for (const lang of ["en", "fr"]) {
    const x = r[lang];
    const parts = [x.meta, x.lead, ...x.sections.flatMap((s) => s.p), ...x.faq.map((f) => f.a)];
    for (const t of parts) if (CLAIM.test(strip(t))) return true;
  }
  return false;
}

const todo = [...rows.values()].filter(flagged);
console.log(`${rows.size} fiches, ${todo.length} à corriger`);
if (DRY) { for (const r of todo.slice(0, 20)) console.log("-", r.slug); process.exit(0); }

const SYSTEM = `You edit cannabis product page texts (JSON, English and French) to remove health and medical claims, for a Canadian catalogue.
Remove or neutralize every statement that a product treats, relieves, soothes, helps with or reduces pain, aches, anxiety, stress, sleep problems, insomnia, inflammation or any condition, for people or pets, including "may help", "designed for relief", "anti-inflammatory", "therapeutic", "healing". Replace them with neutral descriptions (format, ingredients, strength, texture, aroma, how it is used or applied).
The product's official name must be kept exactly as written even if it contains such words (e.g. "Pain Killer Relief Cream", "Gummies for Anxiety", "Healing Salve"); when you mention it, it is only a name.
Keep everything else as close as possible: same JSON shape, same headings unless a heading itself makes a claim, same facts, same language quality, French typography. Return the full JSON object {"meta","lead","sections","faq"} for "en" and "fr": {"en": {...}, "fr": {...}}.`;

let fixed = 0, inTok = 0, outTok = 0;
const queue = [...todo];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const r = queue.shift();
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, temperature: 0.3, response_format: { type: "json_object" },
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({ en: r.en, fr: r.fr }) }] }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(j.error));
      inTok += j.usage.prompt_tokens; outTok += j.usage.completion_tokens;
      const out = JSON.parse(j.choices[0].message.content);
      if (!out.en?.sections || !out.fr?.sections) throw new Error("réponse incomplète");
      appendFileSync(CACHE, JSON.stringify({ ...r, en: out.en, fr: out.fr, model: `${r.model}+${MODEL}-fix` }) + "\n");
      fixed++;
    } catch (e) { console.error("échec", r.slug, String(e).slice(0, 160)); }
  }
}));
console.log(`${fixed}/${todo.length} fiches corrigées, ≈ ${((inTok * 2 + outTok * 8) / 1e6).toFixed(2)} $`);
