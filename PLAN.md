# PLAN — Réseau de 10 sites marchands d'affiliation cannabis (Canada)

> Projet « Cana canada » — Affiliation cannabis Canada (persona Michelle Lanoy)
> Document de cadrage — version du 17/06/2026 — **plan uniquement, rien n'est codé**
> Source de vérité programmes : `dash-affil-maj/CLAUDE.md` + `data.csv`

---

## 1. Objectif

Construire un réseau de **10 sites marchands** (extensible), hébergés sur des noms de domaine expirés, qui :

1. Présentent **tous les produits** de tous les shops affiliés (scrap hebdomadaire, sans tri).
2. Renvoient chaque bouton « Acheter » vers le shop affilié avec l'ID d'affiliation (deep-link).
3. Intègrent un **annuaire local + SEO programmatique** : pages « acheter weed + ville » sur tout le Canada, avec annuaire des shops physiques.
4. Proposent, **pour chaque shop affilié et sur chacun des sites**, des **pages coupons / codes promo** (forte intention d'achat).
5. Sont en **3 langues** (FR / EN / ES), avec **contenu unique par site et par langue**, et **design unique par site**.
6. Ont une **optimisation SEO maximale** dont l'objectif est de **ranker au-dessus des shops affiliés eux-mêmes**.

Trois piliers de contenu :

- **Pilier A — Catalogue produits** (dynamique, mis à jour chaque semaine).
- **Pilier B — Annuaire local & guides villes** (figé une fois généré, gros maillage interne).
- **Pilier C — Coupons & codes promo** (par shop affilié, sur chaque site ; rafraîchis chaque semaine).
- **Pilier D — Axes de contenu additionnels** : comparateur de prix, variétés/strains, nouveautés hebdo, deals saisonniers, comparatifs, avis de shops, guides d'achat, pages par usage.

---

## 2. Architecture générale

```
                 ┌───────────────────────────────────────────┐
                 │              SERVEUR PRIVÉ                  │
                 │                                             │
  Shops          │   ┌──────────┐     ┌──────────────────┐    │
  affiliés  ───► │   │ SCRAPER  │ ──► │  BASE CENTRALE    │    │
  (Woo/Shopify)  │   │ (Python) │     │  PostgreSQL       │    │
                 │   └──────────┘     │  (produits,       │    │
                 │        ▲           │   shops, villes,  │    │
  Données        │        │           │   contenu, images)│    │
  shops physiques│   (cron hebdo)     └─────────┬─────────┘    │
  (fournies)  ──►│                              │              │
                 │   ┌──────────────┐           │              │
  Clés API IA ──►│   │ GÉNÉRATION   │ ◄─────────┘              │
  (texte+image)  │   │ contenu+image│                          │
                 │   └──────┬───────┘                          │
                 │          │                                  │
                 │   ┌──────▼────────────────────────────┐     │
                 │   │  BUILD STATIQUE (Astro) × 10 sites │     │
                 │   │  templates/identités distincts     │     │
                 │   └──────┬────────────────────────────┘     │
                 └──────────┼──────────────────────────────────┘
                            ▼
                  10 sites statiques publiés (FR/EN/ES)
                  → CTA affiliés → shops en ligne
```

Principe clé : **une seule base centrale alimente les 10 sites**. Un changement (prix, nouveau produit) se propage partout au prochain build, automatiquement.

---

## 3. Pilier A — Collecte des produits (scraper)

### Méthode en cascade (du plus stable au moins stable)

1. **Shopify** → endpoint public `/products.json` (paginé) : catalogue complet, structuré, stable.
2. **WooCommerce** → Store API `/wp-json/wc/store/v1/products` : public, structuré (nom, prix, images, variantes, stock).
3. **Fallback universel** → `sitemap.xml` (énumération des URLs produits) + lecture du **JSON-LD `schema.org/Product`** présent sur chaque fiche.
4. **Dernier recours** → scraping CSS ciblé, configuré shop par shop.

### Bonnes pratiques techniques

- Détection automatique de la plateforme (Shopify vs WooCommerce vs autre) par shop.
- Respect du `robots.txt`, throttling + back-off exponentiel, rotation de user-agent.
- **Hash de contenu par produit** pour ne traiter que les nouveautés/modifications.
- Journalisation des erreurs par shop (un shop cassé ne bloque pas les autres).
- Champs collectés : nom, marque, catégorie, type (indica/sativa/hybride/CBD/hash/graines/accessoire), THC/CBD, format/poids, prix + devise, variantes, images, description source, stock, URL produit, shop d'origine.

### Périmètre

- Tous les shops **🟢 ACTIF** de `data.csv` au lancement (BMWO, Get Kush, Ganja West, Low Price Bud, CBD2GO, CBD Magic, CBD2HEAL, The High Club, QCS/Toronto Seeds, Herbies…), puis ajout au fil des approbations.
- **Tous les produits, aucun tri.**

---

## 4. Base de données centrale (PostgreSQL)

Tables principales (schéma simplifié) :

- `shops` — id, nom, domaine, plateforme, lien affilié, **lifetime (oui/non)**, priorité, statut.
- `products` — id, clé canonique, nom, marque, catégorie, type, attributs (THC/CBD/format), `content_hash`, `first_seen`, `last_seen`, statut.
- `product_offers` — produit × shop : prix, devise, url_produit, en_stock, date_maj. (Un produit peut exister chez plusieurs shops → c'est ici qu'on gère les doublons.)
- `product_images` — 2 images par produit (générées une fois, partagées entre sites).
- `content` — texte généré par (produit|page) × **site** × **langue**, avec hash de génération.
- `cities` — villes du Canada, province, population, données locales.
- `physical_shops` — annuaire fourni : nom, ville, adresse, province, (horaires/avis si dispo).
- `coupons` — shop, code, description, type (% / montant / livraison offerte), validité, source (perso/public), `date_maj`, vérifié (oui/non).
- `strains` — souche, type, effets, THC/CBD, goût/arômes ; lien produits ↔ souche (pour les pages variétés et le comparateur).
- `sites` — les 10 sites : domaine, identité/angle, langue(s), thème de design.

### Logique d'ingestion hebdomadaire

Pour chaque produit scrapé :

- **Nouveau** (clé canonique absente) → insertion + enrichissement (images + contenu).
- **Existant, prix changé** → mise à jour du prix → **propagation automatique sur les 10 sites** au build.
- **Existant, prix inchangé** → ignoré (pas de retraitement, pas de regénération).

---

## 5. Règle des doublons & priorité « lifetime »

- **Clé canonique** = `normalisation(nom) + marque + format/poids` (les EAN/GTIN sont rares sur le cannabis), complétée par un **matching flou** pour les quasi-doublons.
- Quand un même produit existe chez plusieurs shops → le bouton « Acheter » pointe vers le vendeur en **affiliation lifetime** (BMWO 15 % à vie, CBD Magic, CBD2HEAL, Kush Station, Vitality CBD, WTF Cannabis, Mellow, Plant of Life… selon `data.csv`).
- À défaut de lifetime : arbitrage par commission la plus élevée, puis fiabilité du shop (DR, avis).
- **Aucun doublon affiché** : un produit = une fiche unique par site, avec le meilleur vendeur.

---

## 6. Pilier B — Annuaire local & SEO programmatique

### Pages « ville »

Pour chaque ville du Canada, une page complète et structurée :

- **Combien ça coûte** — fourchettes de prix locales (données + comparatif).
- **Où trouver** — annuaire des shops physiques de la ville (données fournies par toi).
- **Est-ce légal** — cadre fédéral (Cannabis Act 2018) + règles de la **province** (âge, lieux de vente autorisés, consommation). Factuel et exact (E-E-A-T).
- **Modes d'achat** — magasin physique vs livraison en ligne.
- **FAQ** locale.
- **Gros CTA** vers les shops en ligne avec livraison (liens affiliés).

### Variation lexicale (anti-duplication)

Rotation systématique pilotée par un dictionnaire par langue :

- Verbes : acheter / trouver / obtenir / commander / se procurer / où acheter…
- Noms : weed / cannabis / marijuana / hash / herbe / beuh / fleur…
- Combinaisons variées par ville et par site pour éviter le contenu dupliqué.

### Maillage interne (silos)

`page ville ↔ fiches produits ↔ catégories ↔ villes voisines ↔ hub provincial ↔ accueil`. Objectif : concentrer le jus SEO sur les requêtes « acheter weed + ville ».

### Contenu

- **Unique par site** (angle/structure/ton différents).
- **Figé une fois généré** (les infos locales bougent peu).

---

## 6 bis. Pilier C — Pages coupons & codes promo

- Pour **chaque shop affilié**, une page coupons/codes promo **sur chacun des 10 sites** (+ une page hub « tous les codes promo » par site).
- Cible des requêtes à forte intention commerciale : « code promo [shop] », « [shop] coupon code », « [shop] rabais / discount », déclinées **FR/EN/ES** et avec variations lexicales (code promo / code réduction / coupon / bon de réduction / rabais / deal…).
- **Contenu unique par site et par langue** (même logique faits / éditorial).
- **Fraîcheur** : date de dernière mise à jour affichée ; codes vérifiés et rafraîchis à chaque run hebdo (un coupon expiré nuit au ranking et à la confiance).
- **Sources des codes** : codes personnalisés de tes programmes (ex. CBD2HEAL `MICHELLE20`, code BC Bud Supply, referrals Crystal Cloud 9 / Goldbuds…) + coupons publics récupérés au scrap. Centralisés dans la table `coupons`.
- **Gros CTA** affiliés + maillage interne vers les fiches produits et catégories du shop concerné.
- Données structurées adaptées (Offer / FAQPage).

---

## 6 ter. Pilier D — Axes de contenu additionnels (tous validés)

**Data-driven (alimentés par le scraping, uniques et frais, durs à répliquer) :**

- **Comparateur de prix** — prix multi-shops par produit / catégorie / province, mis à jour chaque semaine (à partir de `product_offers`). Cible « prix du weed au Canada / [province] ». Avantage concurrentiel fort.
- **Pages variétés / strains** — une fiche par souche (effets, THC/CBD, goût, où acheter), mappée sur les produits. Programmatique massif ; maillage vers les fiches produits.
- **Nouveautés de la semaine** — générées automatiquement depuis le diff du scraper. Fraîcheur + visites récurrentes, coût quasi nul.
- **Deals & promos saisonniers** — hub 4/20, Black Friday, soldes. Complète le pilier coupons (gros pics saisonniers).

**Éditoriaux à forte intention d'achat :**

- **Comparatifs « meilleurs shops / meilleurs produits »** — listicles « top sites pour acheter du weed en ligne au Canada », par catégorie. Intention d'achat maximale, maillage naturel vers fiches/shops.
- **Avis / reviews de chaque shop affilié** — requêtes de marque « [shop] avis », forte conversion ; s'appuie sur DR / notoriété / avis de `data.csv`.
- **Guides d'achat** — paiement Interac e-transfer, livraison discrète, première commande, sécurité/légalité. Autorité thématique + E-E-A-T pour soutenir les pages money.
- **Pages par usage** (sommeil, douleur, edibles, vapes…) — ⚠️ **santé / YMYL** : disclaimers obligatoires, ton prudent, **pas d'allégations médicales**, sources fiables.

Tous : **contenu unique par site et par langue** (FR/EN/ES), variations lexicales, maillage interne fort vers les pages money.

---

## 7. Génération de contenu

Séparation en deux couches :

- **Faits = variables** injectées partout (specs produit, prix, légalité, annuaire). Identiques entre sites = pas un problème de duplicate content.
- **Éditorial = généré, unique par site × langue** : prose conditionnée par (faits + **identité du site** + langue). Angle/voix/structure différents → texte réellement différent d'un site à l'autre (pas du synonyme-swapping).

Garde-fous :

- **Régénération seulement si les faits changent** (hash) → coût IA borné, pas de re-paiement hebdo inutile.
- Multilingue **FR / EN / ES** avec `hreflang` correct.
- Modèle de texte : à définir selon tes clés (mes capacités intégrées + éventuelle API que tu fournis).

---

## 8. Génération d'images

- **2 images par produit**, **générées une fois et partagées entre les 10 sites**.
- API : **Gemini (nano banana)** et/ou **GPT Image** selon tes clés (skill `nano-banana-imagegen` déjà installé).
- Stockées dans la base, servies en local (rapidité + indépendance vis-à-vis des sources).

---

## 9. Design & différenciation des 10 sites

- **10 angles/marques distincts** (par catégorie, audience, région ou usage) → réduit l'empreinte de réseau, meilleur ranking.
- **Templates Astro différents par site** : mise en page, composants, palette, typographie.
- **Structures de page variables** : un site met les avis en avant, un autre un guide d'usage, un autre un comparatif…
- Objectif : « impression d'arriver sur des sites différents », pas un réseau cloné.

---

## 10. SEO

- **Technique** : sites statiques (rapides), `sitemap.xml`, `robots.txt`, balises propres, Core Web Vitals optimisés.
- **Données structurées** : `Product`, `Offer`, `LocalBusiness`, `FAQPage`, `BreadcrumbList`.
- **Multilingue** : `hreflang` FR/EN/ES, URLs par langue.
- **Maillage interne** fort (silos produits + silos villes).
- **Objectif outranking** : contenu plus riche et mieux structuré que les shops sources + maillage + vitesse + fraîcheur (mise à jour hebdo).

---

## 11. Boutons d'achat & deep-linking affilié

- Les liens affiliés sont au niveau du shop (ex. `getkush.cc/?ref=michellelanoy`).
- Bouton « Acheter » = **URL produit du shop + paramètre `ref`** (deep-link), avec fallback page d'accueil pour les shops qui ne trackent qu'à l'atterrissage.
- Vérification du comportement de tracking par shop au moment de l'implémentation.

---

## 12. Hébergement & déploiement

- **Serveur privé** (tu fais « ce qui m'arrange » → je propose la config et tu valides l'accès).
- **Build statique** des 10 sites (Astro) régénéré après chaque scrap.
- **Cron hebdomadaire** : scrap → ingestion BDD → génération du nouveau/modifié → build → publication.
- Composants serveur : PostgreSQL, Python (scraper + génération), Node (build Astro), Nginx (service des sites), cron.

---

## 13. Pipeline hebdomadaire (orchestration)

1. Scrap de tous les shops actifs (cascade).
2. Dédup + détection de changements (hash).
3. Mise à jour BDD (insert / update prix / skip).
4. Génération contenu + images **pour le nouveau/modifié uniquement**.
4 bis. Rafraîchissement + vérification des **coupons** (codes valides, dates à jour).
5. Build des 10 sites statiques.
6. Publication + sitemaps régénérés.
7. Rapport de run (produits ajoutés/modifiés, erreurs par shop).

---

## 14. Stack technique (récap)

| Couche | Choix |
|---|---|
| Scraping | Python (cascade Shopify/Woo/JSON-LD/CSS) |
| Base centrale | PostgreSQL |
| Génération texte | IA (modèle selon clés fournies) |
| Génération images | Gemini nano banana / GPT Image |
| Sites | Astro (statique, multilingue) — design distinct par site |
| Service web | Nginx sur serveur privé |
| Orchestration | cron hebdomadaire |

---

## 15. Risques & garde-fous

- **Doorway / pages minces** (pages ville) → exigence de richesse réelle + données locales + variation lexicale. Pages creuses = risque de sanction Google.
- **Empreinte de réseau** (10 sites, même catalogue) → designs + identités + contenus réellement distincts ; idéalement WHOIS/IP/structures variés.
- **Exactitude juridique** → pages « est-ce légal » factuelles et à jour par province (crédibilité + E-E-A-T).
- **Coupons expirés** → vérification hebdomadaire obligatoire + date de maj affichée (codes morts = perte de confiance et de ranking).
- **Pages par usage (santé/YMYL)** → disclaimers, pas d'allégations médicales, sources fiables ; sinon risque SEO et crédibilité.
- **Stabilité du scraping** → cascade + fallback JSON-LD + tolérance aux pannes par shop.
- **CGU des programmes** → tu confirmes que tout est légal/autorisé ; à garder à l'œil programme par programme.

---

## 16. À fournir par toi (non bloquant pour le plan)

1. Les **10 NDD** + l'angle/identité souhaité de chaque site.
2. Les **clés API** : Gemini (nano banana) et/ou GPT Image, + éventuel modèle de texte.
3. Les **données des shops physiques** (annuaire local).
4. **Accès au serveur privé** (SSH ou exécution guidée) + specs.
5. Une **enveloppe budget IA** mensuelle indicative.
6. L'**angle éditorial** souhaité pour les pages « est-ce légal » / CTA livraison.

---

## 17. Roadmap de mise en œuvre (proposition)

- **Phase 0 — Fondations** : serveur + PostgreSQL + schéma BDD + squelette d'orchestration.
- **Phase 1 — Scraper** : cascade Shopify/Woo/JSON-LD sur les shops actifs + dédup + change-detection.
- **Phase 2 — Génération** : pipeline contenu (faits/éditorial, FR/EN/ES) + images (2/produit).
- **Phase 3 — 1er site** : 1 template Astro complet (catalogue + pages ville + pages coupons) comme pilote, bout en bout.
- **Phase 4 — Industrialisation** : 9 autres sites avec identités/designs distincts.
- **Phase 4 bis — Axes additionnels** : comparateur de prix, variétés/strains, nouveautés hebdo, deals, comparatifs, avis de shops, guides, pages par usage.
- **Phase 5 — SEO & maillage** : sitemaps, schema, hreflang, silos, soumission.
- **Phase 6 — Automatisation** : cron hebdo + rapports + monitoring.
```
