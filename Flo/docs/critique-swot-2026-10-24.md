# Cana canada · 24/10/2026 · critique du projet et SWOT (Budboard, phase 2)

Document de travail pour Florian et son associé. Il s'appuie sur une veille concurrentielle faite le 24/10/2026 (sources en bas) et sur l'état du site pilote ce jour-là.

**Limite de méthode.** La veille a utilisé un moteur de recherche américain, pas Google.ca. Les positions citées montrent quel type de contenu se bat sur chaque requête, pas l'ordre réel de Google Canada. À confirmer avec Haloscan ou Semrush avant toute décision lourde.

## 1. Ce que Budboard apporte de nouveau

- **Le seul comparateur de prix entre boutiques de vente par correspondance (MOM) trouvé au Canada.** Ni Leafly.ca, ni Leafythings, ni les listes payées (Straight.com), ni les agrégateurs de codes ne comparent les prix d'un même produit d'une boutique à l'autre.
- **Le prix au gramme par format** (3,5 g, 7 g, 14 g, 28 g, vrac), relevé dans les variantes de chaque fiche. C'est la question que se posent les acheteurs, et personne n'y répond avec des chiffres.
- **Un historique des prix** (en construction : il faut quelques semaines de relevés pour qu'il parle).
- **Des pages variétés qui agrègent ce que disent toutes les boutiques** : type, génétique, THC, saveurs et effets comptés, prix par boutique. Les sites de variétés existants (Leafly, Wikileaf) décrivent la plante ; ils ne disent pas où l'acheter ni à quel prix au Canada.
- **Le français.** Aucun comparateur francophone trouvé. Les requêtes françaises renvoient vers le gouvernement, la presse ou des sites CBD de France.
- **Le croisement en ligne + magasins autorisés.** Les pages villes réunissent les prix en ligne et les 3 809 magasins des registres officiels. Leafly ne couvre que le légal sans prix ; Leafythings mélange tout sans comparer.
- **Des classements fondés sur un chiffre affiché** (prix au gramme, prix de l'once, THC, prix par 10 mg), avec la méthode écrite. Les listes concurrentes sont des placements payés sans méthode.

## 2. Pourquoi Budboard pourrait mieux ranker

1. **Le gain d'information.** Chaque page contient des chiffres qui n'existent nulle part ailleurs (prix au gramme par boutique, position d'un prix dans sa catégorie, écart de prix d'une boutique sur les produits communs). C'est exactement ce que Google valorise depuis les mises à jour « helpful content ».
2. **Une concurrence faible sur la qualité.** Sur le moteur testé, « buy weed online canada » et « cheap ounces canada » sont occupés par des pages parasites (PDF sur des sites universitaires, Notion, profils spam). Google combat ces pages (politique « site reputation abuse »), donc la place peut se libérer pour un site spécialisé. À vérifier sur Google.ca.
3. **La longue traîne.** Environ 4 000 fiches produits, 242 variétés, des centaines de villes, 13 classements, 7 guides, en deux langues. Chaque page vise une requête précise (« gelato strain price canada », « code promo cbd2go »).
4. **Les requêtes de marque mal servies.** « buy my weed online coupon » n'a pas de page dédiée ; les agrégateurs de codes sont minces et faux. Nos pages codes promo ont des codes réels (dont `MICHELLE20`) et un calculateur d'économie.
5. **La technique.** Site statique Astro, rapide, données structurées (Product, ItemList, FAQ, BreadcrumbList), hreflang EN/FR, sitemap prêt.

## 3. Ce qui manque (par ordre d'importance)

1. **La preuve d'expérience (E-E-A-T).** Aucune commande test, aucune photo de colis, aucun délai de livraison mesuré, pas d'auteur réel identifiable. Pour un sujet « Your Money » comme celui-ci, c'est le premier filtre de Google et le premier réflexe des acheteurs (ils vérifient sur r/CanadianMOMs, 71 000 membres).
2. **La couverture.** 11 boutiques, toutes en affiliation. Un comparateur qui n'affiche que ses partenaires n'est pas crédible. Il faut ajouter les grosses boutiques non affiliées (lien sans commission) pour être la référence.
3. **L'automatisation.** Le scraper tourne, mais le site n'est pas reconstruit automatiquement. Tant que la publication hebdomadaire dépend d'une session manuelle, « prix vérifiés chaque semaine » est fragile.
4. **Les photos.** Une partie des produits n'a qu'une illustration (IA ou visuel de catégorie). CBD Magic et CBD2HEAL bloquent les robots sur leurs images.
5. **La donnée de qualité produit.** THC et grades viennent des boutiques (déclaratif, sans certificat d'analyse). Il faut le dire, ce qui est fait, mais on ne peut pas aller plus loin sans analyses.
6. **La mesure.** Pas encore de Search Console, de Bing Webmaster ni de suivi des clics sortants par boutique (sous-identifiants d'affiliation).
7. **L'audience propre.** Pas d'alerte prix par e-mail, pas de liste de suivi. Ce serait la seule façon de ne pas dépendre à 100 % de Google.

## 4. Les deux risques qui peuvent tout arrêter

**Le risque juridique.** La Loi sur le cannabis (art. 17) interdit la promotion, y compris « communiquer des renseignements sur son prix ou sa distribution », sauf pour les acteurs autorisés. En Ontario, la loi 223 (L.O. 2024, chap. 27) a ajouté l'article 8.2 à la Cannabis Control Act : « No person shall knowingly advertise or promote the sale of cannabis by a person or entity that is not authorized ». Les amendes citées par la presse vont jusqu'à 100 000 $ pour un particulier et 250 000 $ pour une société (non vérifié dans le texte). La GRC a déjà poursuivi un site pour promotion en avril 2026. Aucune poursuite connue contre un site d'affiliation, mais un comparateur de prix de boutiques non autorisées correspond très exactement au texte ontarien. **Un avis d'avocat canadien est nécessaire avant d'ouvrir l'indexation**, notamment sur l'exposition d'un opérateur basé en France et sur la perception de commissions issues de ces ventes.

**Le risque Google.** Le PLAN prévoit 10 sites sur des noms de domaine expirés qui revendent les catalogues. Trois politiques anti-spam de Google visent ce modèle mot pour mot : « expired domain abuse » (domaine racheté pour son autorité et réutilisé), « scaled content abuse » (pages produites en masse, IA comprise) et « thin affiliation » (fiches reprises du marchand). Les pages villes peuvent être vues comme des « doorway pages ». La mise à jour anti-spam d'août 2026 a frappé des sites d'affiliation programmatiques à l'échelle du site entier. Dix sites clones multiplient le risque au lieu de le répartir.

## 5. Ce qu'on peut améliorer (priorisé)

1. **Consulter un avocat canadien** (cannabis et publicité) avant l'indexation. Selon l'avis : exclure l'Ontario des pages locales, retirer certains appels à l'achat, ou garder un positionnement « information sur les prix ».
2. **Revoir le PLAN : une marque forte plutôt que 10 clones.** Un seul site sur un domaine neuf ou un domaine expiré du même sujet, sans réutiliser l'autorité d'un site sans rapport. Si plusieurs sites, des angles réellement différents (graines, CBD, Québec) avec des données propres.
3. **Indexer moins, mieux.** Mettre en noindex les fiches produit sans valeur propre (une seule boutique, pas de format, pas de variété) et les villes sans magasin ; garder indexées les pages riches en données.
4. **Commandes tests.** 3 à 5 boutiques : photos du colis, délai réel, qualité, service client. Publier un protocole et des avis datés. C'est le meilleur argument face aux listes payées et aux forums.
5. **Ajouter des boutiques non affiliées** pour couvrir le marché, avec une mention claire sur les liens commissionnés.
6. **Automatiser la publication hebdomadaire** (projet Pages connecté à Git + crochet de déploiement appelé par le Worker).
7. **Alertes prix par e-mail** (Worker + D1), puis un « indice Budboard du prix du gramme » mensuel : une donnée exclusive que la presse spécialisée (StratCann, Straight, Leafly News) peut citer, donc des liens entrants naturels.
8. **Photos :** demander aux gestionnaires d'affiliation leur pack de visuels produits (c'est l'usage), sinon visuels de catégorie. Ne pas contourner les blocages anti-robots.
9. **Mesure :** Search Console, Bing, suivi des clics sortants par boutique et par page.
10. **Registres provinciaux manquants** (Nouvelle-Écosse, Nouveau-Brunswick, Québec à jour, Yukon) : Florian enregistre les pages de localisation depuis son navigateur (Ctrl+S) et on les lit ensuite, ou on écrit aux organismes.

## 6. SWOT

| | Positif | Négatif |
|---|---|---|
| **Interne** | **Forces** · Chaîne de données unique : 11 boutiques, environ 4 000 produits, variantes et prix au gramme, relevé hebdomadaire. · Bilingue EN/FR natif. · 3 809 magasins autorisés issus des registres officiels. · Coût très bas (Cloudflare gratuit, IA sous 50 €/mois). · Identité visuelle distinctive (« catalogue postal »). · Liens d'affiliation déjà obtenus, dont plusieurs à commission à vie. | **Faiblesses** · Ni domaine, ni autorité, ni liens entrants. · Textes en grande partie générés par IA. · THC et grades déclaratifs (boutiques). · Photos incomplètes, illustrations IA. · Couverture limitée aux affiliés. · Publication pas encore automatisée. · Aucune preuve d'expérience ni auteur réel. · Historique de prix encore court. |
| **Externe** | **Opportunités** · Aucun comparateur de prix MOM trouvé, aucun site francophone. · Résultats occupés par du spam que Google combat. · Requêtes de codes promo par boutique mal servies. · Le prix est le premier critère d'achat pour 42 % des consommateurs (enquête canadienne 2023). · Données exclusives = relations presse et liens. · Moteurs de réponse IA qui citent les sources structurées. | **Menaces** · Loi sur le cannabis (art. 17) et loi ontarienne 223 (art. 8.2) sur la promotion de vendeurs non autorisés. · Politiques anti-spam Google (domaines expirés, contenu à grande échelle, affiliation mince, pages satellites) et mise à jour d'août 2026. · Volatilité des boutiques (changements de domaine, 6 programmes morts dans data.csv, démantèlements par la police). · Chaîne de paiement (virements Interac liés à des affaires de blanchiment). · Marché illégal en recul (69 % des consommateurs achètent toujours légal en 2023 ; dépense illégale passée de 47 $ à 8 $ par mois depuis 2020). · Google Ads fermé au cannabis. |

## Sources

- Promotion (Loi sur le cannabis) : [Santé Canada](https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/promotion-prohibitions.html), [texte de loi](https://www.laws-lois.justice.gc.ca/eng/acts/C-24.5/page-4.html)
- Ontario, loi 223 : [Assemblée législative de l'Ontario](https://www.ola.org/en/legislative-business/bills/parliament-43/session-1/bill-223), [StratCann](https://stratcann.com/?p=38789)
- Poursuite pour promotion, avril 2026 : [GRC](https://rcmp.ca/en/news/2026/04/4352324)
- Politiques anti-spam : [Google Search Central](https://developers.google.com/search/docs/essentials/spam-policies) ; mise à jour d'août 2026 : [GSQI](https://gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/)
- Concurrents : [Straight.com](https://www.straight.com/guides/health/best-online-dispensary-canada/), [Leafythings (étude Seologist)](https://seologist.com/case-studies/leafythings.html), [Leafly.ca](https://www.leafly.ca/dispensaries/ontario/cornwall?page=17), [SimplyCodes Get Kush](https://simplycodes.com/store/getkush.cc), [r/CanadianMOMs](https://gummysearch.com/r/CanadianMOMs)
- Marché : [MJBizDaily, enquête canadienne 2023](https://mjbizdaily.com/?p=384320)
- Démantèlements : [CP24, OPP septembre 2026](https://www.cp24.com/news/canada/2026/09/17/more-than-366k-seized-in-illegal-online-cannabis-distribution-network-take-down-opp/), [AGLC](https://aglc.ca/news/new-aglc-investigation-unit-tackles-illegal-online-cannabis), [GRC, 47 M$](https://rcmp.ca/en/news/2025/01/federal-financial-crime-team-charges-bc-resident-connection-47-million-interprovincial-money-0)
