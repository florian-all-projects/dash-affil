// Génère les introductions uniques des pages villes (EN + FR) avec l'API OpenAI.
// Les faits (province, âge légal) sont fournis ; le modèle a l'interdiction d'en inventer d'autres.
// Résultat versionné : src/data/city-intros.json (relancer seulement pour les villes manquantes).
// Usage : OPENAI_API_KEY=... node scripts/gen-city-intros.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error("OPENAI_API_KEY requis");
const MODEL = process.env.TEXT_MODEL || "gpt-4.1-mini";

// geo.ts est du TypeScript simple : on en extrait les données sans outillage.
const geoSrc = readFileSync(new URL("../src/data/geo.ts", import.meta.url), "utf8");
const cities = [...geoSrc.matchAll(/\{ slug: "([^"]+)", name: "([^"]+)", nameFr: "([^"]+)", province: "([A-Z]{2})" \}/g)]
  .map(([, slug, name, nameFr, province]) => ({ slug, name, nameFr, province }));
const provinces = Object.fromEntries(
  [...geoSrc.matchAll(/code: "([A-Z]{2})", slug: "[^"]+", slugFr: "[^"]+", name: "([^"]+)", nameFr: "([^"]+)", age: (\d+)/g)]
    .map(([, code, name, nameFr, age]) => [code, { name, nameFr, age: Number(age) }]),
);

const outPath = new URL("../src/data/city-intros.json", import.meta.url);
const done = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};

const SYSTEM = `You write short, original page introductions for a Canadian cannabis price-comparison guide.
Hard rules:
- Use ONLY the facts given. Never invent store names, addresses, neighbourhoods, statistics, prices, delivery times or laws.
- Do not claim that any online shop is licensed or legal. Do not give medical claims.
- Mention the legal age given, once.
- Vary vocabulary naturally (weed, cannabis, bud, flower...). No clichés like "look no further", no exclamation marks, no emojis.
- Plain, helpful, adult tone. Each intro 80-110 words, 2 short paragraphs.
- The French version is written natively for Canadian French readers (not a literal translation), using « cannabis », « weed », « livraison ».
Return strict JSON: {"en": "...", "fr": "..."}`;

async function gen(city) {
  const p = provinces[city.province];
  const user = `City: ${city.name} (French: ${city.nameFr}), province/territory: ${p.name} (French: ${p.nameFr}). Legal age there: ${p.age}.
Page topic EN: "weed delivery in ${city.name}" — comparing online shops that deliver by mail across Canada, prices updated weekly.
Page topic FR: « livraison de cannabis à ${city.nameFr} ».
Angle to make this intro distinct: ${city.slug.length % 3 === 0 ? "price-conscious buyers comparing value" : city.slug.length % 3 === 1 ? "discreet delivery and convenience" : "choosing between provincial stores and online mail-order"}.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, temperature: 0.8, response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j.error));
  const out = JSON.parse(j.choices[0].message.content);
  if (!out.en || !out.fr) throw new Error(`réponse incomplète pour ${city.slug}`);
  return { en: out.en.trim(), fr: out.fr.trim(), model: MODEL, usage: j.usage };
}

let tokens = 0;
for (const c of cities) {
  if (done[c.slug]) continue;
  const r = await gen(c);
  tokens += r.usage.total_tokens;
  done[c.slug] = { en: r.en, fr: r.fr, model: r.model };
  writeFileSync(outPath, JSON.stringify(done, null, 1));
  console.log(`ok ${c.slug}`);
}
console.log(`terminé : ${Object.keys(done).length} villes, ${tokens} tokens utilisés`);
