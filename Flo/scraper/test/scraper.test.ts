// Tests hors Cloudflare : D1 est simulée par SQLite (node:sqlite) avec le vrai schéma,
// et fetch est remplacé par des réponses construites à partir d'un vrai produit BMWO (Store API, 23/10/2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { affiliateUrl, canonicalKey, categorize, decodeEntities, isExcluded } from "../src/normalize";
import { mapWooProduct, type WooProduct } from "../src/woo";
import { scrapeShop, type Env } from "../src/index";

// --- Simulation minimale de l'API D1 au-dessus de SQLite ---
class Stmt {
  constructor(private db: DatabaseSync, private sql: string, private params: unknown[] = []) {}
  bind(...p: unknown[]) { return new Stmt(this.db, this.sql, p.map((v) => (v === undefined ? null : v))); }
  async first<T>() { return (this.db.prepare(this.sql).get(...(this.params as never[])) ?? null) as T; }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...(this.params as never[])) as T[] }; }
  async run() { const r = this.db.prepare(this.sql).run(...(this.params as never[])); return { meta: { changes: Number(r.changes) } }; }
  exec() { return this.db.prepare(this.sql).run(...(this.params as never[])); }
}
function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../../db/schema.sql", import.meta.url), "utf8"));
  db.exec(readFileSync(new URL("../../db/seed.sql", import.meta.url), "utf8"));
  return {
    raw: db,
    prepare: (sql: string) => new Stmt(db, sql),
    batch: async (stmts: Stmt[]) => { db.exec("BEGIN"); try { stmts.forEach((s) => s.exec()); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; } },
  };
}

// Vrai produit BMWO (Store API, page 1, 23/10/2026), champs utiles seulement.
const purpleRockstar: WooProduct = {
  id: 34017, name: "Purple Rockstar &#8211; Thunder Buddies", slug: "purple-rockstar", type: "variable",
  permalink: "https://buymyweedonline.cc/product/purple-rockstar/",
  short_description: "<ul><li>Indica-Dominant hybrid &#8211; 80% Indica / 20% Sativa</li><li>Strain Graded at AAAAA</li></ul>",
  prices: { price: "14000", regular_price: "14000", sale_price: "14000", currency_code: "CAD", currency_minor_unit: 2, price_range: null },
  is_in_stock: true,
  images: [{ src: "https://buymyweedonline.cc/wp-content/uploads/2026/09/thunder-buddies-purple-rockstar-1.jpg" }],
  categories: [{ slug: "cannabis", name: "Cannabis" }, { slug: "indica", name: "Indica" }, { slug: "aaaaa", name: "AAAAA" }],
  attributes: [{ name: "Choose an Option (gms)", terms: [{ name: "14g" }, { name: "28g" }, { name: "3.5g" }, { name: "7g" }] }],
};
const coolingStick: WooProduct = {
  id: 72709, name: "300mg CBD Cooling Stick &#8211; External Use Only", slug: "cbd-cooling-stick", type: "simple",
  permalink: "https://buymyweedonline.cc/product/cbd-cooling-stick/",
  prices: { price: "6000", regular_price: "8000", sale_price: "6000", currency_code: "CAD", currency_minor_unit: 2 },
  is_in_stock: true, categories: [{ slug: "cbd", name: "CBD" }, { slug: "cbd-topicals", name: "CBD Topicals" }],
};
const shroom: WooProduct = {
  id: 68204, name: "Envision Endurance  &#8211; Microdose Capsules 4000MG Psilocybin", slug: "envision", type: "simple",
  permalink: "https://chronicfarms.cc/product/envision/", prices: { price: "5000", currency_minor_unit: 2 }, is_in_stock: true,
};

test("normalisation des noms et clés canoniques", () => {
  assert.equal(decodeEntities("Purple Rockstar &#8211; Thunder Buddies"), "Purple Rockstar – Thunder Buddies");
  assert.equal(decodeEntities("Mix &#038; Match"), "Mix & Match");
  assert.equal(canonicalKey("Pink Rockstar (AAAA+) &#8211; Smalls Only"), "pink-rockstar-aaaa-smalls-only");
  // Deux grades = deux produits distincts
  assert.notEqual(canonicalKey("1 Ounce Mix and Match (AAAAA)"), canonicalKey("1 Ounce Mix and Match (AAA)"));
});

test("exclusions hors périmètre (psilocybine)", () => {
  assert.equal(isExcluded("Envision Endurance – Microdose Capsules 4000MG Psilocybin", []), true);
  assert.equal(isExcluded("Golden Teacher", ["magic-mushrooms"]), true);
  assert.equal(isExcluded("Purple Rockstar", ["cannabis", "indica"]), false);
  assert.equal(mapWooProduct(shroom, "MOM"), null);
});

test("catégories", () => {
  assert.equal(categorize("Purple Rockstar", ["cannabis", "indica"], "MOM"), "flower");
  assert.equal(categorize("300mg CBD Cooling Stick", ["cbd", "cbd-topicals"], "MOM"), "cbd");
  assert.equal(categorize("Watermelon Gummies 500mg", ["edibles"], "MOM"), "edible");
  assert.equal(categorize("Anything", [], "Graines"), "seed");
  assert.equal(categorize("THC Hemp Seed Oil Capsules", ["edibles"], "MOM"), "edible");
  assert.equal(categorize("Gelato Feminized Seeds", ["seeds"], "MOM"), "seed");
  assert.equal(categorize("Candyland (AAAA+)", ["flower", "aaaa"], "MOM"), "flower");
  assert.equal(categorize("Wedding Cake (AAA)", ["indica"], "MOM"), "flower");
  assert.equal(categorize("Boveda Humidity Pack – 4gram 62%", ["cannabis"], "MOM"), "accessory");
});

test("mapping d'un vrai produit WooCommerce", () => {
  const o = mapWooProduct(purpleRockstar, "MOM")!;
  assert.equal(o.name, "Purple Rockstar – Thunder Buddies");
  assert.equal(o.priceCents, 14000);
  assert.equal(o.category, "flower");
  assert.equal(o.strainType, "indica"); // catégorie « indica » du shop
  assert.equal(o.weights, "14g|28g|3.5g|7g");
  const c = mapWooProduct(coolingStick, "MOM")!;
  assert.equal(c.priceCents, 6000);
  assert.equal(c.compareAtCents, 8000);
});

test("liens affiliés (deep-link)", () => {
  assert.equal(
    affiliateUrl("https://www.thehighclub.biz/product/pink-rockstar/", { deeplink_mode: "path", deeplink_param: "ref/140/", affiliate_url: null }),
    "https://www.thehighclub.biz/product/pink-rockstar/ref/140/",
  );
  assert.equal(
    affiliateUrl("https://getkush.cc/product/x/?variant=2", { deeplink_mode: "query", deeplink_param: "ref=michellelanoy", affiliate_url: null }),
    "https://getkush.cc/product/x/?variant=2&ref=michellelanoy",
  );
  assert.equal(affiliateUrl("https://ganjawest.co/p/", { deeplink_mode: "landing", deeplink_param: null, affiliate_url: "https://ganjawest.co?ref=73813" }), "https://ganjawest.co?ref=73813");
});

// --- Run complet d'un shop avec fetch simulé ---
function stubFetch(pages: WooProduct[][]) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const page = Number(new URL(url).searchParams.get("page"));
    return new Response(JSON.stringify(pages[page - 1] ?? []), {
      status: 200,
      headers: { "content-type": "application/json", "x-wp-totalpages": String(pages.length), "x-wp-total": "3" },
    });
  }) as typeof fetch;
  return calls;
}

test("run complet : création, revisite sans changement, changement de prix, disparition", async () => {
  const d1 = fakeD1();
  const env = { DB: d1 as unknown as D1Database, RUN_TOKEN: "t", PAGE_DELAY_MS: "0" } satisfies Env;
  const shop = d1.raw.prepare("SELECT id, slug, name, domain, category, platform, status FROM shops WHERE slug='bmwo'").get() as never;

  // 1er passage : 2 pages, dont un produit exclu
  const calls = stubFetch([[purpleRockstar, shroom], [coolingStick]]);
  let r = await scrapeShop(env, shop);
  assert.equal(r.status, "ok");
  assert.equal(calls.length, 2);
  assert.deepEqual([r.stats.seen, r.stats.created, r.stats.excluded, r.stats.priceChanged], [2, 2, 1, 0]);

  // 2e passage identique : rien à retraiter
  stubFetch([[purpleRockstar, shroom], [coolingStick]]);
  r = await scrapeShop(env, shop);
  assert.deepEqual([r.stats.created, r.stats.priceChanged], [0, 0]);

  // Baisse de prix + disparition du stick
  await new Promise((res) => setTimeout(res, 1100)); // last_seen est à la seconde près
  stubFetch([[{ ...purpleRockstar, prices: { ...purpleRockstar.prices, price: "12000" } }]]);
  r = await scrapeShop(env, shop);
  assert.equal(r.stats.priceChanged, 1);

  const hist = d1.raw.prepare("SELECT price_cents FROM price_history ORDER BY rowid").all().map((x: any) => x.price_cents);
  assert.deepEqual(hist, [14000, 6000, 12000]);
  const stick = d1.raw.prepare("SELECT in_stock FROM product_offers WHERE source_id='72709'").get() as any;
  assert.equal(stick.in_stock, 0);
  const runs = d1.raw.prepare("SELECT count(*) n FROM scrape_runs WHERE status='ok'").get() as any;
  assert.equal(runs.n, 3);
  const prod = d1.raw.prepare("SELECT count(*) n FROM products").get() as any;
  assert.equal(prod.n, 2);
});

test("page anti-bot Cloudflare détectée et journalisée", async () => {
  const d1 = fakeD1();
  const env = { DB: d1 as unknown as D1Database, RUN_TOKEN: "t", PAGE_DELAY_MS: "0" } satisfies Env;
  const shop = d1.raw.prepare("SELECT id, slug, name, domain, category, platform, status FROM shops WHERE slug='lowpricebud'").get() as never;
  globalThis.fetch = (async () =>
    new Response("<!DOCTYPE html><html><head><title>Just a moment...</title>", { status: 403, headers: { "content-type": "text/html" } })) as typeof fetch;
  const r = await scrapeShop(env, shop);
  assert.equal(r.status, "error");
  assert.match(r.error!, /anti-bot/);
});

// --- Mode « une page par exécution » (plan gratuit) ---
import { step } from "../src/stepper";

test("mode step : cycle complet page par page, puis repos jusqu'au cycle suivant", async () => {
  const d1 = fakeD1();
  // Un seul shop WooCommerce actif pour le test
  d1.raw.exec("UPDATE shops SET status='paused' WHERE slug != 'bmwo'");
  const env = { DB: d1 as unknown as D1Database, PER_PAGE: "2" };
  stubFetch([[purpleRockstar, shroom], [coolingStick]]);

  const actions: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = await step(env);
    actions.push(r.action === "page" ? `page${r.page}${r.done ? "-fin" : ""}` : r.action);
    if (r.action === "idle") break;
  }
  assert.deepEqual(actions, ["cycle_started", "page1", "page2-fin", "idle"]);
  const run = d1.raw.prepare("SELECT status, pages_fetched, offers_seen, offers_new FROM scrape_runs").get() as any;
  assert.deepEqual([run.status, run.pages_fetched, run.offers_seen, run.offers_new], ["ok", 2, 2, 2]);
  const st = d1.raw.prepare("SELECT status FROM scrape_state").get() as any;
  assert.equal(st.status, "done");
});

test("mode step : un shop bloqué est abandonné après 3 essais sans bloquer les autres", async () => {
  const d1 = fakeD1();
  d1.raw.exec("UPDATE shops SET status='paused' WHERE slug NOT IN ('lowpricebud','cbd2heal')");
  const env = { DB: d1 as unknown as D1Database, PER_PAGE: "40" };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).includes("lowpricebud")) {
      return new Response("<title>Just a moment...</title>", { status: 403, headers: { "content-type": "text/html" } });
    }
    return new Response(JSON.stringify([coolingStick]), { status: 200, headers: { "content-type": "application/json", "x-wp-totalpages": "1" } });
  }) as typeof fetch;
  const seen: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = await step(env);
    if (r.action === "idle") break;
    if (r.action === "error") seen.push(`${r.shop}:err${r.gaveUp ? "-abandon" : ""}`);
    if (r.action === "page") seen.push(`${r.shop}:ok`);
  }
  // CBD2HEAL (priorité 85) passe avant Low Price Bud (50)
  assert.deepEqual(seen, ["cbd2heal:ok", "lowpricebud:err", "lowpricebud:err", "lowpricebud:err-abandon"]);
  const failed = d1.raw.prepare("SELECT st.status FROM scrape_state st JOIN shops s ON s.id=st.shop_id WHERE s.slug='lowpricebud'").get() as any;
  assert.equal(failed.status, "failed");
});
