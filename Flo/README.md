# Flo/ : espace de travail Phase 2 de Florian

Ce dossier contient le travail de **Florian** (et de son Claude) sur la **Phase 2** : le réseau de sites marchands décrit dans `PLAN.md`, en commençant par le **V1 (1 site pilote)** défini dans `.claude/context/v1.md`.

L'associé de Florian mène son propre test en parallèle sur ce même repo : **il travaille dans son propre dossier**, pas dans `Flo/`. Ne pas modifier le dossier de l'autre sans le prévenir via `JOURNAL.md`.

## Ce qui reste commun (racine du repo)
- `CLAUDE.md`, `JOURNAL.md`, `PLAN.md`, `data.csv`, `.claude/context/` : documentation et base partagées.
- `index.html`, `secrets.enc`, `plan.html` : dashboard Phase 1 (en ligne via GitHub Pages).
- Toute entrée de `JOURNAL.md` liée à ce dossier commence par **`[Flo]`** dans son titre.

## Structure prévue (créée au fil du V1)
| Dossier | Contenu |
|---|---|
| `Flo/db/` | Schéma PostgreSQL (tables shops, products, product_offers, coupons, cities...) et migrations |
| `Flo/scraper/` | Scraper Python en cascade (Shopify, WooCommerce Store API, JSON-LD, CSS) + dédup + détection de changements |
| `Flo/generation/` | Génération du contenu (faits / éditorial) et des images |
| `Flo/sites/<ndd>/` | Site pilote Astro |
| `Flo/ops/` | Orchestration (cron hebdo), rapports de run |

## Paramètres actés (23/10/2026)
- Budget IA : **50 €/mois** (texte + images).
- Images : **GPT Image** préféré, à confirmer par un test A/B sur ~10 produits avant génération en masse.
- NDD pilote : recherche via Semrush (accès Ranker Fox).

## Règles
- **Aucun secret en clair** dans ce dossier (clés API, mdp, tokens) : variables d'environnement côté serveur, ou `secrets.enc`.
- Le repo est **public** : rien de sensible ici (pas de données personnelles, pas de clés).
