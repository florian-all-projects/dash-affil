# Stack technique (résumé — détail complet dans PLAN.md)

## Vue d'ensemble
Serveur privé : **scraper Python** → **PostgreSQL** central → **génération** (contenu + images) → **build Astro** des 10 sites statiques → publication. **cron hebdomadaire**. Nginx pour servir.

## Scraper (cascade, du + stable au -)
1. **Shopify** : `/products.json` (paginé).
2. **WooCommerce** : Store API `/wp-json/wc/store/v1/products`.
3. **Fallback universel** : `sitemap.xml` + **JSON-LD `schema.org/Product`**.
4. **Dernier recours** : scraping CSS ciblé par shop.
Bonnes pratiques : robots.txt, throttling/back-off, rotation UA, **hash de contenu** par produit, tolérance aux pannes par shop.

## Base PostgreSQL (tables clés)
`shops` (incl. lifetime, priorité), `products` (clé canonique, content_hash), `product_offers` (produit×shop : prix, url, stock), `product_images` (2/produit), `content` (produit|page × site × langue), `cities`, `physical_shops`, `coupons`, `strains`, `sites`.

## Dédup & priorité
Clé canonique = normalisation(nom)+marque+format ; matching flou. Doublon → bouton Acheter vers le vendeur en **affiliation lifetime** (sinon meilleure commission/fiabilité). Un produit = une fiche unique par site.

## Ingestion hebdo
Nouveau → insert + enrichissement ; prix changé → update (propagation auto aux 10 sites) ; inchangé → skip.

## Génération
Faits = variables injectées ; éditorial = généré unique par site/langue (régénéré seulement si les faits changent). Images : Gemini nano banana / GPT Image, 2/produit, partagées.

## Boutons d'achat
URL produit du shop + paramètre `ref`/affilié (deep-link), fallback accueil si tracking à l'atterrissage.

## À fournir (Florian)
10 NDD + angles, clés API (texte + image), données shops physiques, accès serveur, budget IA.
