# Avancement du projet

## Phase 1 — Affiliation (en cours)
🟢 **Liens actifs** : Get Kush, BMWO (lifetime), Ganja West, Low Price Bud, CBD2GO, The High Club, CBD Magic (lifetime), CBD2HEAL (lifetime, coupon MICHELLE20), Quebec Cannabis Seeds, Toronto Cannabis Seeds. (Liens exacts dans `CLAUDE.md` / `secrets.enc`.)
📨 BC Bud Supply : plan promo envoyé, attend approbation.
⏳ En attente : Grasscity (8%), Kush Station, Chronic Farms, Green Affiliates, True North, Green Avenger.
✅ Inscrits sans lien : Herbies, Speed Greens, WTF Cannabis, Cannaffex, Plant of Life.
Surveillance emails : tâche planifiée **1×/jour à 9h** (⚠️ plus rien journalisé entre le 20/07 et le 23/10 : vérifier qu'elle tourne). Rattrapage du 23/10 : aucune nouvelle approbation.

## Phase 2 — Réseau de sites marchands (LANCÉE le 23/10/2026 par Florian)
- Plan complet validé : voir `PLAN.md`. 4 piliers (produits / annuaire local / coupons / axes additionnels).
- Décisions actées : Astro + PostgreSQL + Python ; 10 sites à angles distincts ; contenu unique par site/langue ; serveur privé ; tout le Canada ; tous les produits sans tri.
- Décisions du 23/10/2026 : on démarre par le **V1 (1 site pilote)** ; **budget IA 50 €/mois** (texte + images) ; images : **GPT Image** préféré par Florian, à confirmer par un test A/B sur ~10 produits ; recherche du NDD pilote via **Semrush** (accès Ranker Fox), Haloscan étant centré FR ; risque juridique accepté (voir `audience.md`).
- Validé par Florian le 23/10 : **1 image par produit** au départ (2e image plus tard, shops lifetime d'abord) ; **test A/B GPT Image vs Nano Banana sur ~10 produits** avant génération en masse ; code Phase 2 : d'abord prévu dans un repo privé, **finalement dans `Flo/` de ce repo public** (choix de Florian, 23/10) avec la règle : aucun NDD du réseau, aucune clé ni token commité (config Cloudflare ou `secrets.enc`).
- Constat Semrush (base CA, 23/10) : marché **anglophone**. « weed delivery » 9 900/mois (KD 53), « weed dispensary » 6 600, « online dispensary canada » 2 900, « buy weed online » 2 400 (KD 68), « buy weed online canada » 1 600 (KD 69), « weed delivery vancouver » 1 600 (KD 44), toronto 1 000, ottawa/edmonton 590, calgary/montreal 480. Le **FR québécois est quasi nul** (« cannabis en ligne » 390, le reste < 50). → Recommandation : site pilote **EN d'abord**, FR ensuite, ES non prioritaire.
- SERP « buy weed online canada » : top 10 dominé par des MOM AS 51-65 (wccannabis, greensociety, pacificgrass, cheapweed, bulkbuddy) + OCS, mais **2 pages à autorité quasi nulle** (mmjexpress.cc AS 6 / 20 RD, ganjagrams.cc AS 0) → un NDD expiré avec ~100+ domaines référents propres est compétitif, surtout sur les pages villes.
- NDD : les domaines des shops morts de data.csv sont tous encore enregistrés (vérif RDAP 23/10). **À surveiller : vaped.ca** (AS 21, 1,9K domaines référents) expire le 19/12/2026. Le sourcing d'expirés demande un outil dédié (expireddomains.net, SpamZilla…) : compte requis, Semrush sert à évaluer les candidats.
- **Organisation du repo** : le travail Phase 2 de Florian vit dans **`Flo/`** ; l'associé crée son propre dossier pour son test. Les fichiers racine (CLAUDE.md, JOURNAL.md, data.csv, PLAN.md, .claude/context) restent communs.
- Page plan publiée : http://dash.secoursvert.net/plan.html

- **Infra (23/10)** : D1 `cana-catalog` créée et remplie (schéma + 11 shops) ; Worker scraper codé et testé dans `Flo/scraper/`, en attente de déploiement. Voir `Flo/README.md`.

## En attente de Florian (bloquant V1)
1 NDD pilote + angle (pas de NDD pour l'instant : démarrage possible sur sous-domaine workers.dev) · clé API OpenAI (images) · hébergement : **Cloudflare validé** (compte relié à Claude) → manque un **token API** pour déployer + activer **Workers Paid (5 $/mois)** · données shops physiques (non bloquant pour le pilote : pages villes d'abord sur le top 30).

## Prochaines actions
1. Récupérer lien/coupon BC Bud Supply.
2. Surveiller les approbations en attente.
3. Configurer payout Low Price Bud.
4. Phase 2 V1 : schéma PostgreSQL + scraper (dans `Flo/`), puis génération, site pilote Astro (voir `v1.md`).
5. Sécurité : mdp en clair retirés et historique git purgé le 23/10/2026 (voir JOURNAL). Nouveau mdp dashboard + re-chiffrement faits le 23/10. Rotation des mdp des comptes shops : **refusée par Florian** (risque accepté).
