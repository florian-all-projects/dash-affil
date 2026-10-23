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
| Scraper + cron hebdo | **Worker `cana-scraper`** (Cron Trigger lundi 06h17 UTC) | Python + cron serveur |
| Images produits | fichiers statiques du site (R2 non activé sur le compte) | stockage serveur |
| Site pilote | Worker + Static Assets (Astro), d'abord sur `*.workers.dev` en noindex | Nginx |

- **Plan Workers Paid (5 $/mois) requis en production** : le plan gratuit limite à 10 ms de CPU et 50 requêtes sortantes par exécution.
- Déploiement : `npx wrangler deploy` avec `CLOUDFLARE_API_TOKEN` dans l'environnement (jamais commité).

## Ce qui existe (23/10/2026)
| Dossier | Contenu | État |
|---|---|---|
| `db/schema.sql` | Schéma D1 : shops, products, product_offers, price_history, product_images, sites, content, cities, provinces, physical_shops, coupons, strains, scrape_runs | **appliqué** sur D1 |
| `db/seed.sql` | 11 shops actifs (plateforme détectée, deep-link affilié), 3 coupons, 13 provinces (âge légal), site `pilot` | **appliqué** sur D1 |
| `scraper/` | Worker TypeScript : collecte WooCommerce Store API, normalisation, dédup par clé canonique, détection des changements de prix (empreinte), historique des prix, journal des runs | **codé et testé** (7 tests), **pas encore déployé** (token API manquant) |
| `generation/` | Contenu (faits / éditorial) et images | à faire |
| `sites/pilot/` | Site pilote Astro | à faire |

### Plateformes des shops actifs (détectées le 23/10/2026 dans un vrai navigateur)
- **WooCommerce, Store API publique** (`/wp-json/wc/store/v1/products`) : BMWO (150 produits), Get Kush (548), Low Price Bud (1 263), The High Club (366), Chronic Farms (525), CBD Magic (174), CBD2HEAL (39), CBD2GO (144). Environ **3 200 produits**.
- **AbanteCart** (pas d'API) : Quebec Cannabis Seeds, Toronto Cannabis Seeds → scraping HTML à écrire.
- **Ganja West** : bloqué par un challenge Cloudflare (« Just a moment »), même dans un navigateur → à résoudre.
- Low Price Bud affiche aussi un challenge Cloudflare au premier accès : à surveiller au premier run.

### Règle de périmètre
Le catalogue couvre **cannabis, CBD, graines et accessoires uniquement**. Chronic Farms vend aussi des produits à la psilocybine : le scraper **exclut** tout produit psilocybine / champignons / autres substances (`isExcluded` dans `scraper/src/normalize.ts`).

### Lancer les tests du scraper
```bash
cd Flo/scraper && npm install && npm test        # D1 simulée par SQLite, fetch simulé
npx tsc --noEmit                                  # vérification des types
npx wrangler deploy --dry-run --outdir /tmp/dist  # compilation du Worker sans déployer
```

### Routes du Worker (une fois déployé)
- `GET /health` : test simple.
- `GET /run?shop=<slug>` avec `Authorization: Bearer <RUN_TOKEN>` : passage manuel d'un shop.
- `GET /status` (même auth) : 30 derniers runs.

## Paramètres actés (23/10/2026)
- Budget IA : **50 €/mois** (texte + images).
- Images : **GPT Image** préféré, **1 image par produit** au départ, test A/B sur ~10 produits avant génération en masse. Avec ~3 200 produits à ~0,034 $ l'image (qualité medium), le catalogue complet coûte ~110 $ : à étaler sur plusieurs mois ou à réserver d'abord aux produits mis en avant.
- Langue du pilote : **EN d'abord** recommandé (Semrush : le FR québécois pèse très peu), voir `progress.md`.
- NDD pilote : recherche via Semrush (accès Ranker Fox) ; en attendant, sous-domaine `workers.dev`.

## Règles
- **Aucun secret en clair** dans ce dossier (clés API, mdp, tokens) : secrets Cloudflare (`wrangler secret put`) ou `secrets.enc`.
- Le repo est **public** : rien de sensible ici (pas de données personnelles, pas de clés, pas de NDD du réseau).
