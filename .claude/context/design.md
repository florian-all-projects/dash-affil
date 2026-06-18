# Design des sites

## Principe central
**Design unique par site.** 10 templates distincts (mise en page, palette, typographie, composants) pour donner l'impression d'arriver sur des sites différents et réduire l'empreinte de réseau.

## Stack front
- **Astro** (sites statiques, multilingue, rapides). Régénérés après chaque scrap hebdo.
- Mobile-first, **Core Web Vitals** optimisés (objectif SEO/outranking).
- Accessibilité de base (contraste, sémantique, alt).

## Composants récurrents (déclinés par thème)
- Carte produit (image, prix, badge type, **bouton Acheter** → lien affilié deep-link).
- Bloc coupon (code, validité, date de maj, CTA).
- Page ville (prix locaux, annuaire shops physiques, légalité, FAQ, CTA livraison).
- Fiche variété/strain, comparatifs, fiches avis de shop.
- Maillage interne visible (silos produits / villes).

## Images
2 images par produit (Gemini nano banana / GPT Image), générées une fois et **partagées entre sites**.

## Référence de style existante
Le dashboard et la page plan utilisent un thème vert (#1f5132 / #2e7d4f) — c'est l'interface interne, **pas** un modèle pour les sites publics, qui doivent chacun avoir leur propre identité.
