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

## Ce qui existe (23/10/2026)
| Dossier | Contenu | État |
|---|---|---|
| `db/schema.sql` | Schéma D1 : shops, products, product_offers, price_history, product_images, sites, content, cities, provinces, physical_shops, coupons, strains, scrape_runs | **appliqué** sur D1 |
| `db/seed.sql` | 11 shops actifs (plateforme détectée, deep-link affilié), 3 coupons, 13 provinces (âge légal), site `pilot` | **appliqué** sur D1 |
| `scraper/` | Worker TypeScript : collecte WooCommerce Store API, normalisation, catégories, exclusions, upsert D1, empreinte prix/stock, historique des prix, journal des runs | **déployé** (9 tests OK) |
| `sites/pilot/` | Site pilote **Budboard**, Astro 5 statique, **EN + FR**, alimenté par D1 au build | **en ligne** (noindex) |

### Site pilote Budboard (`sites/pilot/`)
- **Marque** : Budboard (neutre ; « NorthBud » écarté car North Bud Farms existe). Concept : tableau de prix de dispensaire.
- **Design** : palette dérivée du thème 21st.dev « Forest Copper » (épinette, feuille, cuivre, sauge), police Archivo (axe de largeur : titres condensés). Listes en « rangées de menu » plutôt qu'en cartes. Voir `src/styles/global.css`.
- **Pages (EN / FR)** : accueil avec tableau des prix, menu + catégories paginées, fiche produit (tous les prix côte à côte, bouton principal = shop lifetime sinon le moins cher), 38 villes (`/weed-delivery/<ville>/`, `/fr/livraison-cannabis/<ville>/`), 13 provinces (légalité), boutiques, codes promo, méthode, guide d'achat. Contrôle d'âge (19+, 18 AB, 21 QC), mention d'affiliation, liens `rel="sponsored nofollow"`, hreflang, schema (Product, FAQPage, BreadcrumbList).
- **Contenus** : intros des villes générées par OpenAI (`scripts/gen-city-intros.mjs` → `src/data/city-intros.json`, faits imposés, ~0,02 $) ; provinces, guide, méthode, boutiques rédigés à la main (`src/data/geo.ts`, `src/views/TextPage.astro`, `src/data/shops-content.ts`) ; fiches produits construites à partir des faits (`productBlurb`).
- **Images** : test A/B le 23/10 sur 3 modèles GPT (1-mini, 1.5, 2) → **gpt-image-1.5 (medium)** retenu pour les visuels mis en avant, gpt-image-1-mini pour le volume. 8 visuels de catégories générés (`public/img/cat/`), `scripts/gen-images.py`.
  - **Produits mis en avant** : `node scripts/featured-images.mjs [max=30] [--dry]` (après `npm run data`) choisit les plus fortes remises puis, par catégorie, les produits des shops lifetime, au plus 2 par type de visuel ; génère `public/img/p/<slug>.webp` et enregistre la ligne dans `product_images` (D1). Le prompt décrit la forme du produit, **jamais son nom** (marques). Les fiches affichent « Image d'illustration ». Sans image propre, la fiche reprend le visuel de sa catégorie. `--dry` liste les choix et les prompts sans rien générer.
- **Prix** : le prix affiché est celui du plus petit format. Prix barré retenu seulement pour un produit à prix unique (sur un produit variable, la Store API mélange les variantes). Bouton principal = shop en affiliation à vie ; s'il n'est pas le moins cher, son prix est écrit sur le bouton.
- **Sitemap** : `/sitemap.xml` (EN + FR, annotations hreflang) généré au build. **Pas encore déclaré dans robots.txt** : à ajouter quand le NDD sera branché et le noindex levé.
- **Mise à jour** : `npm run data` (export D1 → `src/data/generated/`, non versionné) puis `npm run build` puis `npx wrangler pages deploy dist --project-name budboard-ca --branch main --commit-dirty=true` (variables `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` dans l'environnement, valeurs dans `secrets.enc`).

### Plateformes des shops actifs (détectées le 23/10/2026 dans un vrai navigateur)
- **WooCommerce, Store API publique** (`/wp-json/wc/store/v1/products`) : BMWO (150 produits), Get Kush (548), Low Price Bud (1 263), The High Club (366), Chronic Farms (525), CBD Magic (174), CBD2HEAL (39), CBD2GO (144). Environ **3 200 produits**.
- **AbanteCart** (pas d'API) : Quebec Cannabis Seeds, Toronto Cannabis Seeds → scraping HTML à écrire.
- **Ganja West** : bloqué par un challenge Cloudflare (« Just a moment »), même dans un navigateur → à résoudre.
- Low Price Bud affiche aussi un challenge Cloudflare au premier accès : à surveiller au premier run.

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

## Paramètres actés (23/10/2026)
- Budget IA : **50 €/mois** (texte + images).
- Images : **GPT Image** préféré, **1 image par produit** au départ, test A/B sur ~10 produits avant génération en masse. Avec ~3 200 produits à ~0,034 $ l'image (qualité medium), le catalogue complet coûte ~110 $ : à étaler sur plusieurs mois ou à réserver d'abord aux produits mis en avant.
- Langues : **EN + FR dès le départ** (demande de Florian le 23/10), EN à la racine, FR sous `/fr/`.
- NDD pilote : recherche via Semrush (accès Ranker Fox) ; en attendant, `budboard-ca.pages.dev` en noindex.

## Règles
- **Aucun secret en clair** dans ce dossier (clés API, mdp, tokens) : secrets Cloudflare (`wrangler secret put`) ou `secrets.enc`.
- Le repo est **public** : rien de sensible ici (pas de données personnelles, pas de clés, pas de NDD du réseau).
