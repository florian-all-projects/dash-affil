// Mode « plan gratuit » : chaque exécution traite UNE page d'UN shop, puis rend la main.
// Le plan gratuit des Workers limite une exécution à 10 ms de CPU et 50 requêtes sortantes :
// on découpe donc la collecte en petites tranches, déclenchées chaque minute par le Cron Trigger.
// L'avancement est stocké dans la table scrape_state. Un cycle complet est relancé tous les CYCLE_DAYS jours.

import { addToRun, closeRun, loadOfferHashes, markMissing, saveOffers, startRun, type RunStats, type ShopRow } from "./db";
import { ChallengeError, fetchWooPage, mapWooProduct, type ScrapedOffer } from "./woo";
import { discover, fetchLdProducts, type DiscoverConfig } from "./jsonld";

export interface StepEnv {
  DB: D1Database;
  PER_PAGE?: string;    // produits par page (défaut 40)
  CYCLE_DAYS?: string;  // fréquence d'un cycle complet (défaut 7)
  MAX_ATTEMPTS?: string;// tentatives par page avant d'abandonner le shop pour ce cycle (défaut 3)
}

export const STATE_DDL = `CREATE TABLE IF NOT EXISTS scrape_state (
  shop_id INTEGER PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  next_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER,
  run_id INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  cycle_started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
)`;

const SUPPORTED = ["woocommerce", "jsonld"];
// Mode jsonld : page 1 = énumération des URL (file scrape_queue), puis LD_BATCH fiches par exécution
const LD_BATCH = 8;

export const QUEUE_DDL = `CREATE TABLE IF NOT EXISTS scrape_queue (
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  url TEXT NOT NULL,
  PRIMARY KEY (shop_id, pos)
)`;

interface Job extends ShopRow {
  scrape_config: string | null;
  state_status: string;
  next_page: number;
  run_id: number | null;
  attempts: number;
  cycle_started_at: string;
}

export type StepResult =
  | { action: "idle"; nextCycleAt: string }
  | { action: "cycle_started"; shops: number }
  | { action: "page"; shop: string; page: number; totalPages: number; stats: RunStats; done: boolean }
  | { action: "error"; shop: string; page: number; error: string; gaveUp: boolean };

const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

export async function step(env: StepEnv): Promise<StepResult> {
  const db = env.DB;
  const perPage = Number(env.PER_PAGE ?? "40");
  const cycleDays = Number(env.CYCLE_DAYS ?? "7");
  const maxAttempts = Number(env.MAX_ATTEMPTS ?? "3");

  const job = await db
    .prepare(
      `SELECT sh.id, sh.slug, sh.name, sh.domain, sh.category, sh.platform, sh.status, sh.scrape_config,
              st.status AS state_status, st.next_page, st.run_id, st.attempts, st.cycle_started_at
       FROM scrape_state st JOIN shops sh ON sh.id = st.shop_id
       WHERE st.status IN ('running','pending')
       ORDER BY st.status = 'running' DESC, sh.priority DESC LIMIT 1`,
    )
    .first<Job>();

  if (!job) {
    // Aucun travail en cours : faut-il lancer un nouveau cycle ?
    const last = await db.prepare("SELECT max(cycle_started_at) AS t FROM scrape_state").first<{ t: string | null }>();
    const due = !last?.t || Date.now() - Date.parse(last.t) >= cycleDays * 86400_000;
    if (!due) return { action: "idle", nextCycleAt: new Date(Date.parse(last!.t!) + cycleDays * 86400_000).toISOString() };
    const t = nowIso();
    const r = await db
      .prepare(
        `INSERT INTO scrape_state (shop_id, status, next_page, total_pages, run_id, attempts, cycle_started_at, updated_at)
         SELECT id, 'pending', 1, NULL, NULL, 0, ?, ? FROM shops
         WHERE status = 'active' AND platform IN (${SUPPORTED.map(() => "?").join(",")})
         ON CONFLICT(shop_id) DO UPDATE SET status='pending', next_page=1, total_pages=NULL, run_id=NULL, attempts=0,
           cycle_started_at=excluded.cycle_started_at, updated_at=excluded.updated_at`,
      )
      .bind(t, t, ...SUPPORTED)
      .run();
    return { action: "cycle_started", shops: r.meta.changes ?? 0 };
  }

  // Premier passage sur ce shop pour ce cycle : on ouvre un run.
  let runId = job.run_id;
  if (job.state_status === "pending" || !runId) {
    runId = await startRun(db, job.id, job.platform ?? "?");
    await db
      .prepare("UPDATE scrape_state SET status='running', run_id=?, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE shop_id=?")
      .bind(runId, job.id)
      .run();
  }

  const page = job.next_page;
  try {
    const stats: RunStats = { pages: 1, seen: 0, created: 0, priceChanged: 0, excluded: 0 };
    let offers: ScrapedOffer[] = [];
    let totalPages: number;
    let empty = false;
    if (job.platform === "jsonld") {
      const cfg = JSON.parse(job.scrape_config ?? "null") as DiscoverConfig | null;
      if (!cfg) throw new Error("scrape_config manquant pour un shop jsonld");
      if (page === 1) {
        // Énumération : on remplit la file, aucune fiche lue à ce tour
        const urls = await discover(cfg);
        await db.prepare("DELETE FROM scrape_queue WHERE shop_id = ?").bind(job.id).run();
        const ins = urls.map((u, i) => db.prepare("INSERT INTO scrape_queue (shop_id, pos, url) VALUES (?, ?, ?)").bind(job.id, i, u));
        for (let i = 0; i < ins.length; i += 100) await db.batch(ins.slice(i, i + 100));
        totalPages = 1 + Math.ceil(urls.length / LD_BATCH);
        empty = urls.length === 0;
      } else {
        const { results } = await db
          .prepare("SELECT url FROM scrape_queue WHERE shop_id = ? AND pos >= ? AND pos < ? ORDER BY pos")
          .bind(job.id, (page - 2) * LD_BATCH, (page - 1) * LD_BATCH)
          .all<{ url: string }>();
        const r = await fetchLdProducts(results.map((x) => x.url), job.category);
        offers = r.offers;
        const n = await db.prepare("SELECT count(*) AS n FROM scrape_queue WHERE shop_id = ?").bind(job.id).first<{ n: number }>();
        totalPages = 1 + Math.ceil((n?.n ?? 0) / LD_BATCH);
        empty = results.length === 0;
      }
    } else {
      const r = await fetchWooPage(job.domain, page, perPage);
      totalPages = r.totalPages;
      empty = r.items.length === 0;
      for (const p of r.items) {
        const o = mapWooProduct(p, job.category);
        if (o) offers.push(o);
        else stats.excluded++;
      }
    }
    const known = await loadOfferHashes(db, job.id, offers.map((o) => o.sourceId));
    await saveOffers(db, job, offers, known, stats);
    await addToRun(db, runId, stats);

    const done = empty || page >= totalPages;
    if (done) {
      const run = await db.prepare("SELECT started_at FROM scrape_runs WHERE id = ?").bind(runId).first<{ started_at: string }>();
      await markMissing(db, job.id, run!.started_at);
      await closeRun(db, runId, "ok", null);
      await db.prepare("UPDATE scrape_state SET status='done', total_pages=?, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE shop_id=?").bind(totalPages, job.id).run();
    } else {
      await db
        .prepare("UPDATE scrape_state SET next_page=?, total_pages=?, attempts=0, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE shop_id=?")
        .bind(page + 1, totalPages, job.id)
        .run();
    }
    return { action: "page", shop: job.slug, page, totalPages, stats, done };
  } catch (e) {
    const msg = e instanceof ChallengeError ? `anti-bot : ${e.message}` : String(e instanceof Error ? e.message : e);
    const attempts = job.attempts + 1;
    const gaveUp = attempts >= maxAttempts;
    if (gaveUp) {
      await closeRun(db, runId, page > 1 ? "partial" : "error", msg);
      await db.prepare("UPDATE scrape_state SET status='failed', attempts=?, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE shop_id=?").bind(attempts, job.id).run();
    } else {
      await db.prepare("UPDATE scrape_state SET attempts=?, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE shop_id=?").bind(attempts, job.id).run();
      // Garde la trace de l'erreur même si on réessaie
      await db.prepare("UPDATE scrape_runs SET error=? WHERE id=?").bind(`essai ${attempts} page ${page} : ${msg}`.slice(0, 500), runId).run();
    }
    return { action: "error", shop: job.slug, page, error: msg, gaveUp };
  }
}
