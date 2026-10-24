-- Schéma D1 (SQLite) du catalogue Phase 2 « Cana canada »
-- Base Cloudflare D1 : cana-catalog (créée le 23/10/2026, région ENAM)
-- Adapté de PLAN.md §4 (PostgreSQL -> SQLite/D1). Idempotent : CREATE ... IF NOT EXISTS.
-- Prix stockés en centimes (entier) pour éviter les arrondis. Dates en ISO 8601 UTC (TEXT).

PRAGMA foreign_keys = ON;

-- Shops affiliés (source : data.csv, statut ACTIF)
CREATE TABLE IF NOT EXISTS shops (
  id              INTEGER PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,          -- ex. 'bmwo'
  name            TEXT NOT NULL,
  domain          TEXT NOT NULL UNIQUE,          -- ex. 'buymyweedonline.cc'
  category        TEXT NOT NULL,                 -- MOM | CBD | Graines | Accessoires
  platform        TEXT,                          -- shopify | woocommerce | jsonld | css | NULL = à détecter
  affiliate_url   TEXT,                          -- lien affilié d'accueil (public dans CLAUDE.md)
  deeplink_mode   TEXT,                          -- 'query' (ajoute ?ref=...) | 'path' | 'landing' (accueil seulement) | NULL
  deeplink_param  TEXT,                          -- ex. 'ref=michellelanoy' quand deeplink_mode = 'query'
  commission      TEXT,                          -- texte libre (data.csv)
  lifetime        INTEGER NOT NULL DEFAULT 0,    -- 1 = commission à vie (prioritaire en cas de doublon)
  priority        INTEGER NOT NULL DEFAULT 50,   -- plus haut = préféré en cas de doublon
  status          TEXT NOT NULL DEFAULT 'active',-- active | paused | dead
  notes           TEXT,
  scrape_config   TEXT,                          -- JSON, plateforme jsonld : {"discover":"sitemap"|"listing","url":...} (voir scraper/src/jsonld.ts)
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Variétés (pages strains)
CREATE TABLE IF NOT EXISTS strains (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  slug            TEXT NOT NULL UNIQUE,
  strain_type     TEXT,
  thc_range       TEXT,
  cbd_range       TEXT,
  effects         TEXT,
  flavors         TEXT
);

-- Produits canoniques (un produit = une fiche, quel que soit le nombre de shops)
CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY,
  canonical_key   TEXT NOT NULL UNIQUE,          -- normalisation(nom)+marque+format (PLAN §5)
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  brand           TEXT,
  category        TEXT,                          -- flower | edible | concentrate | vape | cbd | seed | accessory | other
  strain_type     TEXT,                          -- indica | sativa | hybrid | NULL
  thc             TEXT,
  cbd             TEXT,
  weight          TEXT,                          -- format / poids normalisé
  strain_id       INTEGER REFERENCES strains(id),
  content_hash    TEXT,                          -- hash des faits ; change => régénération du contenu
  status          TEXT NOT NULL DEFAULT 'active',-- active | gone | excluded (hors périmètre, voir normalize.ts)
  first_seen      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_seen       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Offres : produit x shop (c'est ici que vivent prix, stock et URL source)
CREATE TABLE IF NOT EXISTS product_offers (
  id              INTEGER PRIMARY KEY,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id         INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  source_id       TEXT NOT NULL,                 -- id produit/variante côté shop
  product_url     TEXT NOT NULL,
  price_cents     INTEGER,
  compare_at_cents INTEGER,                      -- prix barré éventuel
  currency        TEXT NOT NULL DEFAULT 'CAD',
  in_stock        INTEGER,
  raw_name        TEXT,                          -- nom tel que publié par le shop
  image_url       TEXT,                          -- image source (référence uniquement)
  description_src TEXT,                          -- description source (référence, jamais republiée telle quelle)
  offer_hash      TEXT,                          -- hash prix+stock+nom ; change => update
  first_seen      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_seen       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (shop_id, source_id)
);
CREATE INDEX IF NOT EXISTS idx_offers_product ON product_offers(product_id);

-- Historique des prix (alimente le comparateur et les pages « nouveautés / deals »)
CREATE TABLE IF NOT EXISTS price_history (
  offer_id        INTEGER NOT NULL REFERENCES product_offers(id) ON DELETE CASCADE,
  price_cents     INTEGER,
  in_stock        INTEGER,
  seen_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_price_history_offer ON price_history(offer_id, seen_at);

-- Image générée (1 par produit au départ, décision du 23/10/2026), partagée entre sites
CREATE TABLE IF NOT EXISTS product_images (
  id              INTEGER PRIMARY KEY,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 1,
  path            TEXT NOT NULL,                 -- chemin du fichier servi
  model           TEXT,                          -- ex. gpt-image-1.5 / nano-banana
  prompt          TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (product_id, position)
);

-- Sites du réseau (le NDD reste NULL dans le repo public, voir Flo/README.md)
CREATE TABLE IF NOT EXISTS sites (
  id              INTEGER PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,          -- ex. 'pilot'
  domain          TEXT,                          -- renseigné uniquement dans D1
  angle           TEXT,                          -- identité / angle éditorial
  langs           TEXT NOT NULL DEFAULT 'en',    -- 'en' | 'en,fr' | 'en,fr,es'
  theme           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'  -- draft | live
);

-- Contenu éditorial unique par (entité x site x langue)
CREATE TABLE IF NOT EXISTS content (
  id              INTEGER PRIMARY KEY,
  entity_type     TEXT NOT NULL,                 -- product | city | shop | coupon_page | category | strain | guide
  entity_id       INTEGER NOT NULL,
  site_id         INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  lang            TEXT NOT NULL,
  field           TEXT NOT NULL,                 -- title | meta | intro | body | faq ...
  body            TEXT NOT NULL,
  facts_hash      TEXT,                          -- hash des faits utilisés ; différent => régénérer
  model           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (entity_type, entity_id, site_id, lang, field)
);

-- Villes du Canada (pages « weed delivery + ville »)
CREATE TABLE IF NOT EXISTS cities (
  id              INTEGER PRIMARY KEY,
  province        TEXT NOT NULL,                 -- code : ON, QC, BC, AB...
  slug            TEXT NOT NULL,                 -- unique dans la province (Windsor ON / Windsor NS)
  name            TEXT NOT NULL,
  name_fr         TEXT,
  population      INTEGER,
  lat             REAL,
  lng             REAL,
  UNIQUE (province, slug)
);

-- Règles par province (âge légal, détaillant public, consommation)
CREATE TABLE IF NOT EXISTS provinces (
  code            TEXT PRIMARY KEY,              -- ON, QC...
  name            TEXT NOT NULL,
  legal_age       INTEGER NOT NULL,              -- 19 partout sauf AB 18 et QC 21
  public_retailer TEXT,                          -- ex. OCS, SQDC
  notes           TEXT,
  source_url      TEXT,
  verified_at     TEXT
);

-- Annuaire des magasins physiques autorisés (registres officiels des provinces, voir Flo/stores/)
CREATE TABLE IF NOT EXISTS physical_shops (
  id              INTEGER PRIMARY KEY,
  city_id         INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  postal_code     TEXT,
  phone           TEXT,
  website         TEXT,
  lat             REAL,
  lng             REAL,
  hours           TEXT,
  source          TEXT,                          -- registre officiel : AGCO, AGLC, LCRB, SQDC...
  source_url      TEXT,
  retrieved_at    TEXT,
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Coupons / codes promo (pilier C)
CREATE TABLE IF NOT EXISTS coupons (
  id              INTEGER PRIMARY KEY,
  shop_id         INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  description     TEXT,
  kind            TEXT,                          -- percent | amount | free_shipping
  value           TEXT,
  valid_until     TEXT,
  source          TEXT NOT NULL,                 -- affiliate (code perso) | public (email/site du shop)
  verified        INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (shop_id, code)
);

-- Journal des runs du scraper (rapport hebdo, PLAN §13)
CREATE TABLE IF NOT EXISTS scrape_runs (
  id              INTEGER PRIMARY KEY,
  shop_id         INTEGER REFERENCES shops(id),
  started_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  finished_at     TEXT,
  method          TEXT,                          -- shopify | woocommerce | jsonld | css
  status          TEXT NOT NULL DEFAULT 'running',-- running | ok | partial | error
  pages_fetched   INTEGER DEFAULT 0,
  offers_seen     INTEGER DEFAULT 0,
  offers_new      INTEGER DEFAULT 0,
  prices_changed  INTEGER DEFAULT 0,
  error           TEXT
);

-- Avancement du scraper en mode « une page par exécution » (plan gratuit, voir scraper/src/stepper.ts)
CREATE TABLE IF NOT EXISTS scrape_state (
  shop_id          INTEGER PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | running | done | failed
  next_page        INTEGER NOT NULL DEFAULT 1,
  total_pages      INTEGER,
  run_id           INTEGER,
  attempts         INTEGER NOT NULL DEFAULT 0,
  cycle_started_at TEXT NOT NULL,
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- File d'URL des shops collectés par JSON-LD (remplie à la page 1 de chaque cycle)
CREATE TABLE IF NOT EXISTS scrape_queue (
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  pos     INTEGER NOT NULL,
  url     TEXT NOT NULL,
  PRIMARY KEY (shop_id, pos)
);
