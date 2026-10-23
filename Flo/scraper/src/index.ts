// Worker Cloudflare « cana-scraper » : collecte des catalogues des shops affiliés vers D1.
// Deux modes (variable MODE) :
// - "step" (défaut, plan gratuit) : le Cron Trigger appelle step() chaque minute, une page d'un shop à la fois
//   (voir stepper.ts) ; un cycle complet est relancé tous les CYCLE_DAYS jours.
// - "full" (plan Workers Paid) : un cron hebdo passe tous les shops d'un coup (scrapeShop).
// Routes (en-tête Authorization: Bearer <RUN_TOKEN>) :
// - GET /step             : exécute une tranche à la main.
// - GET /run?shop=<slug>  : passage complet d'un shop (mode full, plan payant conseillé).
// - GET /status           : derniers runs + état du cycle.

import { finishRun, loadOfferHashes, markMissing, saveOffers, startRun, type RunStats, type ShopRow } from "./db";
import { ChallengeError, fetchWooPage, mapWooProduct } from "./woo";
import { step } from "./stepper";

export interface Env {
  DB: D1Database;
  RUN_TOKEN: string;      // secret : wrangler secret put RUN_TOKEN
  PAGE_DELAY_MS?: string; // politesse entre deux pages en mode full (défaut 1500 ms)
  MODE?: string;          // "step" (défaut) | "full"
  PER_PAGE?: string;
  CYCLE_DAYS?: string;
  MAX_ATTEMPTS?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SUPPORTED = new Set(["woocommerce"]);

export async function scrapeShop(env: Env, shop: ShopRow): Promise<{ status: string; stats: RunStats; error: string | null }> {
  const stats: RunStats = { pages: 0, seen: 0, created: 0, priceChanged: 0, excluded: 0 };
  if (!shop.platform || !SUPPORTED.has(shop.platform)) {
    return { status: "skipped", stats, error: `plateforme non gérée : ${shop.platform ?? "inconnue"}` };
  }
  const startedAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const runId = await startRun(env.DB, shop.id, shop.platform);
  const known = await loadOfferHashes(env.DB, shop.id);
  const delay = Number(env.PAGE_DELAY_MS ?? "1500");
  let status = "ok";
  let error: string | null = null;

  try {
    let page = 1;
    let totalPages = 1;
    do {
      const { items, totalPages: tp } = await fetchWooPage(shop.domain, page);
      totalPages = tp;
      stats.pages++;
      if (!items.length) break;
      const offers = [];
      for (const p of items) {
        const o = mapWooProduct(p, shop.category);
        if (o) offers.push(o);
        else stats.excluded++;
      }
      await saveOffers(env.DB, shop, offers, known, stats);
      page++;
      if (page <= totalPages) await sleep(delay);
    } while (page <= totalPages);
    // Run complet : ce qui n'a pas été revu passe hors stock.
    await markMissing(env.DB, shop.id, startedAt);
  } catch (e) {
    status = stats.pages > 1 ? "partial" : "error";
    error = e instanceof ChallengeError ? `anti-bot : ${e.message}` : String(e instanceof Error ? e.message : e);
  }

  await finishRun(env.DB, runId, status, stats, error);
  return { status, stats, error };
}

async function activeShops(env: Env, slug?: string): Promise<ShopRow[]> {
  const q = slug
    ? env.DB.prepare("SELECT id, slug, name, domain, category, platform, status FROM shops WHERE slug = ?").bind(slug)
    : env.DB.prepare("SELECT id, slug, name, domain, category, platform, status FROM shops WHERE status = 'active' ORDER BY priority DESC");
  return (await q.all<ShopRow>()).results;
}

function authorized(req: Request, env: Env): boolean {
  const h = req.headers.get("Authorization") || "";
  return !!env.RUN_TOKEN && h === `Bearer ${env.RUN_TOKEN}`;
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    if ((env.MODE ?? "step") === "step") {
      ctx.waitUntil(step(env).then((r) => { if (r.action !== "idle") console.log(JSON.stringify(r)); }));
      return;
    }
    ctx.waitUntil(
      (async () => {
        for (const shop of await activeShops(env)) {
          const r = await scrapeShop(env, shop);
          console.log(JSON.stringify({ shop: shop.slug, ...r }));
        }
      })(),
    );
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (!authorized(req, env)) return new Response("unauthorized", { status: 401 });

    if (url.pathname === "/step") return Response.json(await step(env));

    if (url.pathname === "/run") {
      const slug = url.searchParams.get("shop") || undefined;
      if (!slug) return Response.json({ error: "paramètre shop requis" }, { status: 400 });
      const [shop] = await activeShops(env, slug);
      if (!shop) return Response.json({ error: "shop inconnu" }, { status: 404 });
      return Response.json({ shop: shop.slug, ...(await scrapeShop(env, shop)) });
    }

    if (url.pathname === "/status") {
      const { results } = await env.DB.prepare(
        `SELECT r.id, s.slug, r.started_at, r.finished_at, r.status, r.pages_fetched, r.offers_seen, r.offers_new,
                r.prices_changed, r.error
         FROM scrape_runs r LEFT JOIN shops s ON s.id = r.shop_id ORDER BY r.id DESC LIMIT 30`,
      ).all();
      const state = await env.DB.prepare(
        `SELECT s.slug, st.status, st.next_page, st.total_pages, st.attempts, st.cycle_started_at, st.updated_at
         FROM scrape_state st JOIN shops s ON s.id = st.shop_id ORDER BY st.status, s.priority DESC`,
      ).all();
      return Response.json({ state: state.results, runs: results });
    }
    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
