# Flo/ : espace de travail Phase 2 de Florian

> Décision du 23/10/2026 (révisée) : **le code Phase 2 vit ici, dans `Flo/`**, plutôt que dans un repo privé séparé. Comme ce repo est **public** : **aucun nom de domaine du réseau, aucune clé API, aucun token** n'est commité. Ils restent dans la config Cloudflare (variables et secrets) ou dans `secrets.enc`.

Ce dossier contient le travail de **Florian** (et de son Claude) sur la **Phase 2** : le réseau de sites marchands décrit dans `PLAN.md`, en commençant par le **V1 (1 site pilote)** défini dans `.claude/context/v1.md`.

L'associé de Florian mène son propre test en parallèle sur ce même repo : **il travaille dans son propre dossier**, pas dans `Flo/`. Ne pas modifier le dossier de l'autre sans le prévenir via `JOURNAL.md`.

## Ce qui reste commun (racine du repo)
- `CLAUDE.md`, `JOURNAL.md`, `PLAN.md`, `data.csv`, `.claude/context/` : documentation et base partagées.
- `index.html`, `secrets.enc`, `plan.html` : dashboard Phase 1 (en ligne via GitHub Pages).
- Toute entrée de `JOURNAL.md` liée à ce dossier commence par **`[Flo]`** dans son titre.

## Hébergement : tout sur Cloudflare (décision du 23/10/2026)
Pas de VPS. Compte Cloudflare de Florian (celui relié à Claude, qui héberge aussi le Worker du gîte).
| Brique | Cloudflare | Remplace (PLAN.md) |
|---|---|---|
| Base centrale | **D1 `cana-catalog`** (id `b1792254-2898-4c6b-8175-4a7ad127d183`, région ENAM) | PostgreSQL |
| Scraper | **Worker `cana-scraper`**, **plan gratuit** : cron chaque minute, 1 page (40 produits) d'1 shop par exécution, cycle complet tous les 7 jours (`scraper/src/stepper.ts`, table `scrape_state`). Pas d'URL publique. | Python + cron serveur |
| Images | fichiers statiques du site (`sites/pilot/public/img/`, R2 non activé sur le compte) | stockage serveur |
| Site pilote | **Cloudflare Pages classique, projet `budboard-ca`** → https://budboard-ca.pages.dev (noindex) | Nginx |

- **Plan gratuit choisi par Florian (23/10)** : pas de Workers Paid. D'où le scraper « une page par minute ». Si un jour Workers Paid : `MODE=full`, cron hebdo, `limits.cpu_ms`.
- Clés (token Cloudflare `cana-deploy`, OpenAI, 21st.dev) : **dans `secrets.enc`** uniquement. Pour travailler : les exporter en variables d'environnement (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `OPENAI_API_KEY`, `TWENTYFIRST_API_KEY`).
- ⚠️ **Piège Wrangler (constaté le 23/10)** : `wrangler pages project create` convertit maintenant le projet en Worker (ajoute `@astrojs/cloudflare`, un `wrangler.jsonc`, et publie sur `<projet>.floriancaux.workers.dev`, qui affiche le nom de Florian). Ne pas l'utiliser : le projet Pages existe déjà (créé par l'API), déployer avec `npm run deploy` (`wrangler pages deploy dist --project-name budboard-ca --branch main`).

## Ce qui existe (mis à jour le 24/10/2026)
| Dossier | Contenu | État |
|---|---|---|
| `db/schema.sql` | Schéma D1 : shops, products, product_offers, price_history, product_images, sites, content, cities, provinces, physical_shops, coupons, strains, scrape_runs, scrape_state, scrape_queue | **appliqué** sur D1 |
| `db/seed.sql` | 11 shops actifs (plateforme, deep-link affilié, config JSON-LD), 3 coupons, 13 provinces, site `pilot` | **appliqué** sur D1 |
| `scraper/` | Worker TypeScript : WooCommerce Store API + **JSON-LD** (sitemap ou pages de liste, pour AbanteCart), normalisation, catégories, exclusions, upsert D1, historique des prix | **déployé** (11 tests OK) |
| `gen/` | Génération IA : `product-content.mjs` (fiches produits EN/FR), `compliance-pass.mjs` (retire les allégations santé) | utilisé le 24/10 |
| `stores/` | Annuaire des magasins autorisés (registres officiels des provinces) → D1 `cities` + `physical_shops`. Voir `stores/README.md` (⚠️ droits) | 3 804 magasins, 889 villes |
| `sites/pilot/` | Site pilote **Budboard**, Astro 5 statique, **EN + FR**, identité « catalogue postal » (`DESIGN.md`) | **en ligne** (noindex) |

### Site pilote Budboard (`sites/pilot/`) : refonte du 24/10/2026
Refonte demandée par Florian le 24/10 (pas assez e-commerce, contenus trop faibles, pas de commerces locaux, pas d'identité, SEO faible, footer vide).
- **Identité « catalogue postal »** (choix de Florian) : prix sur timbres, cachet d'édition daté (= date du relevé), encadrés « étiquette de colis », bleu encre + rouge boîte aux lettres + kraft, Big Shoulders Display + Public Sans. Détail : `sites/pilot/DESIGN.md`.
- **Arborescence** (EN à la racine, FR sous `/fr/`) :
  - accueil (vise « buy weed online Canada » / « acheter du cannabis en ligne au Canada », comparateur) ;
  - `/catalogue/` (+ recherche `?q=`), catégories à la racine `/flower/`, `/edibles/`… (`/fr/fleurs/`…) avec filtres type / shop / tri sur la catégorie entière (`/data/cat-<cat>.json`) et pagination 48 ;
  - fiche produit `/product/<slug>/` (`/fr/produit/<slug>/`) : photo, timbre de prix, formats, bouton d'achat, encadré livraison/paiement du shop, tableau comparatif de tous les shops, fiche technique (THC, CBD, génétique, effets décrits, saveurs…), description en 4 sections, FAQ, produits liés, barre d'achat fixe sur mobile ;
  - silo géographique `/weed-delivery/<province>/` puis `/weed-delivery/<province>/<ville>/` (`/fr/livraison-cannabis/...`) : règles de la province, prix en ligne, sélection de produits, **annuaire des magasins autorisés** (schema Store), texte long, FAQ, villes voisines ;
  - `/shops/<shop>/` (avis factuel), `/coupons/<shop>/` (codes promo), `/deals/`, `/about/` (méthode), `/legal/` ;
  - pied de page complet (catégories, villes, provinces, avis boutiques, codes promo, pages légales) ;
  - anciennes adresses redirigées en 301 (`public/_redirects`), la page « guide » supprimée redirige vers l'accueil.
- **Images** : photo publiée par le shop (choix de Florian, 24/10), créditée sous la photo ; images IA conservées pour les 35 produits mis en avant ; sinon visuel de catégorie. Les photos des shops sont téléchargées par `npm run data` dans `public/img/s/` (non versionné) ; CBD Magic et CBD2HEAL refusent les robots (403) → visuel de catégorie.
- **Contenus** (tous dans D1, table `content`, site `pilot`) :
  - fiches produits : `node gen/product-content.mjs --site pilot --out <dossier>` (gpt-4.1-mini, ~0,003 $ la fiche EN+FR, à partir de la description du shop, sans invention ni allégation santé ; ne régénère que si les faits changent) puis `node gen/compliance-pass.mjs --cache <dossier>/products-pilot.jsonl` puis relancer `product-content.mjs` pour réécrire le SQL et l'appliquer avec `wrangler d1 execute` ;
  - pages accueil, catégories, provinces, villes, boutiques : `npx tsx sites/pilot/scripts/gen-page-content.ts --out <dossier>` (gpt-4.1 ; villes en gpt-4.1-mini avec `TEXT_MODEL`), mêmes faits que le site, puis `wrangler d1 execute`.
- **Mise à jour du site** : `npm run data` (export D1 → `src/data/generated/` + photos des shops) puis `python3 scripts/fetch-second-images.py` (2e photo de galerie) puis `npm run build` puis `npm run deploy`. Aperçu local rapide : `BB_SAMPLE=3 npx astro build` (3 fiches par rayon seulement).

### Modules et pages ajoutés le 24/10/2026 (après-midi)
- **Formats et prix au gramme** : `scraper/scripts/collect-variants.ts <sortie.sql> [--shop slug] [--skip <sql interrompu>] [--recheck-grams 448]` lit les variantes (`data-product_variations`) et la galerie de chaque offre WooCommerce → tables D1 `offer_variants`, `offer_images` (à appliquer avec `wrangler d1 execute`). ~35 min pour tout le catalogue (1 requête/s par shop) : lancer en tâche de fond longue ou par shop. Parseur des formats : `scraper/src/formats.ts` (testé : « 1-4-lb » = 112 g).
- **Pas de pavés de texte** : chaque page est faite de modules chiffrés (`src/components/viz/` : barres, position dans la distribution, historique, schéma génétique, répartition) ; les textes éditoriaux sont présentés en fiches courtes repliables (`GuideBlocks.astro`).
- **Moteur de filtres** `src/components/Explorer.astro` : rendu statique des 48 premiers produits + filtrage dans le navigateur sur toute la liste (`/data/cat-*.json`, `shop-*.json`, `col-*.json`, `deals.json`, `new.json`, `all.json`), état dans l'URL.
- **Variétés** `/strains/<slug>/` (`/fr/varietes/`) : variété = nom simple d'une fleur ou d'une graine, rattachement des autres produits par segment de nom (`lib/catalog.ts`), profil agrégé dans `lib/strains.ts`. Page si 2 produits ou plus.
- **Classements** `/best/<slug>/` (`/fr/selection/`) : définis dans `src/data/collections.ts` (filtre + tri + mesure + méthode), publiés si 6 produits ou plus.
- **Nouveautés** `/new/` : boutiques entrées après la 1re édition, puis produits apparus chez une boutique déjà suivie (`lib/sets.ts`).
- **Guides** `/guides/<slug>/` : sujets et sources dans `src/data/guides.ts`, texte en blocs typés généré par `npx tsx scripts/gen-guides.ts --out .cache/guides` (gpt-4.1, ~0,20 $ les 7 guides EN+FR) puis `wrangler d1 execute` ; les graphiques sont recalculés à chaque build (`lib/guide-data.ts`), le texte ne cite aucun chiffre qui change.
- **Sites qui bloquent les robots** (CBD Magic et CBD2HEAL pour les photos, registres NS/NB/Yukon/SQDC en direct) : on ne contourne pas les protections. Voies prévues : packs photos / flux produits demandés aux gestionnaires d'affiliation ; pages des registres enregistrées par Florian depuis son navigateur ou données demandées aux organismes.

### Plateformes des shops actifs
- **WooCommerce, Store API publique** (`/wp-json/wc/store/v1/products`) : BMWO, Get Kush, Low Price Bud, The High Club, Chronic Farms, CBD Magic, CBD2HEAL, CBD2GO et **Ganja West** (le challenge Cloudflare vu le 23/10 dans un navigateur ne bloque pas le Worker : 917 offres le 24/10).
- **JSON-LD** (méthode n°3 du PLAN) : **Quebec Cannabis Seeds** (sitemap.xml) et **Toronto Cannabis Seeds** (pages de liste `/cannabis-seeds?page=N`), lus fiche par fiche (8 par exécution). Config dans `shops.scrape_config`.
- En attente de lien affilié (donc pas collectés) : Herbies, True North / Canuk, Green Affiliates (Crop King…).

### Règle de périmètre
Le catalogue couvre **cannabis, CBD, graines et accessoires uniquement**. Chronic Farms vend aussi des produits à la psilocybine : le scraper **exclut** tout produit psilocybine / champignons / autres substances (`isExcluded` dans `scraper/src/normalize.ts`).
Le 23/10/2026, Florian a demandé d'inclure ces produits : Claude ne l'a pas fait (vente de psilocybine illégale au Canada hors exemption de Santé Canada). L'exclusion reste en place.
Sont aussi exclus (constaté le 23/10/2026 dans les catalogues) : **tabac** (cigarettes, cigares), **médicaments sur ordonnance** (sildénafil, tadalafil, Viagra, Cialis, y compris mélangés à du CBD), cartes cadeaux et articles offerts (`OUT_OF_SCOPE`). Après un changement de règle, `cd scraper && npx tsx scripts/reapply-rules.ts` montre l'effet sur le catalogue en base, `--apply` l'applique (produits exclus → statut `excluded`). Les champignons dits fonctionnels sans psilocybine (lion's mane, reishi, chaga) peuvent être ajoutés en catégorie bien-être s'ils sont vendus par les shops.

### Lancer les tests du scraper
```bash
cd Flo/scraper && npm install && npm test        # D1 simulée par SQLite, fetch simulé
npx tsc --noEmit                                  # vérification des types
npx wrangler deploy --dry-run --outdir /tmp/dist  # compilation du Worker sans déployer
```

### Suivre / déclencher le scraper
- Pas d'URL publique (`workers_dev: false`). État du cycle : requête D1 sur `scrape_state` et `scrape_runs` (connecteur Cloudflare ou `wrangler d1 execute cana-catalog --remote`).
- Lancer une tranche à la main : `npx wrangler dev --remote --test-scheduled` puis `curl "http://127.0.0.1:8787/__scheduled?cron=*+*+*+*+*"` (⚠️ peut doubler une page si le cron tourne en même temps : sans gravité).
- Vider le catalogue pour repartir de zéro : `DELETE FROM price_history; DELETE FROM product_offers; DELETE FROM products; DELETE FROM scrape_state; DELETE FROM scrape_runs;`.

## Paramètres actés (23 et 24/10/2026)
- Budget IA : **50 €/mois** (texte + images).
- Images : **photos des shops pour le catalogue** (décision de Florian le 24/10) + images GPT (gpt-image-1.5) déjà générées pour les produits mis en avant ; la génération IA en masse est reportée.
- Langues : **EN + FR dès le départ** (demande de Florian le 23/10), EN à la racine, FR sous `/fr/`.
- NDD pilote : recherche via Semrush (accès Ranker Fox) ; en attendant, `budboard-ca.pages.dev` en noindex.

## Règles
- **Aucun secret en clair** dans ce dossier (clés API, mdp, tokens) : secrets Cloudflare (`wrangler secret put`) ou `secrets.enc`.
- Le repo est **public** : rien de sensible ici (pas de données personnelles, pas de clés, pas de NDD du réseau).
