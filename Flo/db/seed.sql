-- Données initiales de la base D1 cana-catalog (23/10/2026)
-- Shops : statut ACTIF de data.csv. Liens affiliés = ceux déjà publics dans CLAUDE.md.
-- Plateformes détectées le 23/10/2026 depuis un vrai navigateur :
--   /wp-json/wc/store/v1/products (WooCommerce Store API, public) et /products.json (Shopify).
-- deeplink_mode : 'query' = ajouter ?param à l'URL produit ; 'path' = ajouter le segment AffiliateWP
--   en fin d'URL produit (ex. /product/x/ref/140/). À VÉRIFIER shop par shop avant mise en ligne.

INSERT INTO shops (slug, name, domain, category, platform, affiliate_url, deeplink_mode, deeplink_param, commission, lifetime, priority, status, notes) VALUES
 ('bmwo',          'Buy My Weed Online',     'buymyweedonline.cc',       'MOM',     'woocommerce', 'https://buymyweedonline.cc/ref/michellelanoy/', 'path',  'ref/michellelanoy/', '15% par vente, client rattaché à vie', 1, 90, 'active', '150 produits (Store API, 23/10)'),
 ('getkush',       'Get Kush',               'getkush.cc',               'MOM',     'woocommerce', 'https://getkush.cc/?ref=michellelanoy',        'query', 'ref=michellelanoy',  '7,5% (jusqu''à 10%)',                   0, 60, 'active', '548 produits (Store API, 23/10) ; bundles type woosb'),
 ('ganjawest',     'Ganja West',             'ganjawest.co',             'MOM',     'woocommerce',          'https://ganjawest.co?ref=73813',                'query', 'ref=73813',          '7,5% (points)',                         0, 40, 'active', 'Challenge Cloudflare vu le 23/10 dans un navigateur ; Store API joignable le 24/10'),
 ('lowpricebud',   'Low Price Bud',          'lowpricebud.co',           'MOM',     'woocommerce', 'https://lowpricebud.co/?ref=michellelanoy',     'query', 'ref=michellelanoy',  'Non publié',                            0, 50, 'active', '1263 produits (Store API, 23/10) ; challenge Cloudflare au 1er accès, passé après ~8 s dans un navigateur'),
 ('thehighclub',   'The High Club',          'thehighclub.biz',          'MOM',     'woocommerce', 'https://www.thehighclub.biz/ref/140/',          'path',  'ref/140/',           '3% à vie',                              1, 70, 'active', '366 produits (Store API, 23/10) ; domaine en www'),
 ('chronicfarms',  'Chronic Farms',          'chronicfarms.cc',          'MOM',     'woocommerce', 'https://chronicfarms.cc/ref/117/',              'path',  'ref/117/',           'Non publié (5-10% prob.)',              0, 45, 'active', '525 produits (Store API, 23/10) ; vend aussi des produits à la psilocybine : EXCLUS du catalogue (hors périmètre cannabis)'),
 ('cbdmagic',      'CBD Magic',              'cbdmagic.co',              'CBD',     'woocommerce', 'https://cbdmagic.co/cbd/1061/',                 'path',  'cbd/1061/',          '15% + 5% à vie + 5% tier2',             1, 85, 'active', '174 produits (Store API, 23/10)'),
 ('cbd2heal',      'CBD2HEAL',               'cbd2heal.ca',              'CBD',     'woocommerce', 'https://cbd2heal.ca/heal/213/',                 'path',  'heal/213/',          '15% + 5% à vie + 5% tier2',             1, 85, 'active', '39 produits (Store API, 23/10)'),
 ('cbd2go',        'CBD2GO',                 'cbd2go.co',                'CBD',     'woocommerce', 'https://cbd2go.co/ref/10651/',                  'path',  'ref/10651/',         '10%, cookie 90 j',                      0, 55, 'active', '144 produits (Store API, 23/10)'),
 ('qcs',           'Quebec Cannabis Seeds',  'quebeccannabisseeds.com',  'Graines', 'jsonld',  'https://quebeccannabisseeds.com/?a_aid=mlanoy', 'query', 'a_aid=mlanoy',       '20% + 5% sous-affiliés',                0, 60, 'active', 'AbanteCart sans API : sitemap.xml + JSON-LD Product de chaque fiche'),
 ('torontoseeds',  'Toronto Cannabis Seeds', 'torontocannabisseeds.com', 'Graines', 'jsonld',  'https://torontocannabisseeds.com/?a_aid=mlanoy','query', 'a_aid=mlanoy',       '20% + 5% (compte QCS)',                 0, 55, 'active', 'AbanteCart sans sitemap : pages de liste /cannabis-seeds + JSON-LD Product')
ON CONFLICT(slug) DO UPDATE SET platform=excluded.platform, notes=excluded.notes, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now');

-- Coupons connus
INSERT INTO coupons (shop_id, code, description, kind, value, valid_until, source, verified) VALUES
 ((SELECT id FROM shops WHERE slug='cbd2heal'), 'MICHELLE20', 'Code affilié personnel', 'percent', '20', NULL, 'affiliate', 1),
 ((SELECT id FROM shops WHERE slug='cbd2go'),   'FALL25',     'Fall Sale (email du 24/09/2026)', 'percent', '25', NULL, 'public', 0),
 ((SELECT id FROM shops WHERE slug='cbd2go'),   'THANKS35',   'Thanksgiving + livraison offerte (email du 09/10/2026), probablement expiré', 'percent', '35', NULL, 'public', 0)
ON CONFLICT(shop_id, code) DO NOTHING;

-- Provinces et territoires : âge légal (Wikipedia « Cannabis laws of Canada by province or territory », vérifié le 23/10/2026)
INSERT INTO provinces (code, name, legal_age, public_retailer, source_url, verified_at) VALUES
 ('AB','Alberta',18,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('BC','British Columbia',19,'BC Cannabis Stores','https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('MB','Manitoba',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('NB','New Brunswick',19,'Cannabis NB','https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('NL','Newfoundland and Labrador',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('NS','Nova Scotia',19,'NSLC','https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('NT','Northwest Territories',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('NU','Nunavut',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('ON','Ontario',19,'Ontario Cannabis Store (OCS)','https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('PE','Prince Edward Island',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('QC','Quebec',21,'SQDC','https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('SK','Saskatchewan',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23'),
 ('YT','Yukon',19,NULL,'https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory','2026-10-23')
ON CONFLICT(code) DO NOTHING;

-- Site pilote (NDD à renseigner uniquement dans D1, jamais dans le repo public)
INSERT INTO sites (slug, domain, angle, langs, theme, status) VALUES
 ('pilot', NULL, 'À définir : pages « weed delivery + ville » en colonne vertébrale (EN d''abord)', 'en', NULL, 'draft')
ON CONFLICT(slug) DO NOTHING;

-- Énumération des fiches pour les shops collectés par JSON-LD (voir scraper/src/jsonld.ts)
UPDATE shops SET scrape_config = '{"discover":"sitemap","url":"https://quebeccannabisseeds.com/sitemap.xml","exclude":"/blog|review|how-to|best-|guide|faq|frequently|about|contact|shipping|payment|policy|terms|disclaimer|affiliate|\\?"}' WHERE slug = 'qcs';
UPDATE shops SET scrape_config = '{"discover":"listing","url":"https://torontocannabisseeds.com/cannabis-seeds?sort=name-ASC&limit=50&page={page}","link":"class=\"prdocutname\" href=\"([^\"]+)\"","maxPages":10}' WHERE slug = 'torontoseeds';
