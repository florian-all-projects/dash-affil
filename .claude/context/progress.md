# Avancement du projet

## Phase 1 — Affiliation (en cours)
🟢 **Liens actifs** : Get Kush, BMWO (lifetime), Ganja West, Low Price Bud, CBD2GO, The High Club, CBD Magic (lifetime), CBD2HEAL (lifetime, coupon MICHELLE20), Quebec Cannabis Seeds, Toronto Cannabis Seeds. (Liens exacts dans `CLAUDE.md` / `secrets.enc`.)
📨 BC Bud Supply : plan promo envoyé, attend approbation.
⏳ En attente : Grasscity (8%), Kush Station, Chronic Farms, Green Affiliates, True North, Green Avenger.
✅ Inscrits sans lien : Herbies, Speed Greens, WTF Cannabis, Cannaffex, Plant of Life.
Surveillance emails : tâche planifiée **1×/jour à 9h**.

## Phase 2 — Réseau de sites marchands (LANCÉE le 23/10/2026 par Florian)
- Plan complet validé : voir `PLAN.md`. 4 piliers (produits / annuaire local / coupons / axes additionnels).
- Décisions actées : Astro + PostgreSQL + Python ; 10 sites à angles distincts ; contenu unique par site/langue ; serveur privé ; tout le Canada ; tous les produits sans tri.
- Décisions du 23/10/2026 : on démarre par le **V1 (1 site pilote)** ; **budget IA 50 €/mois** (texte + images) ; images : **GPT Image** préféré par Florian, à confirmer par un test A/B sur ~10 produits ; recherche du NDD pilote via **Semrush** (accès Ranker Fox), Haloscan étant centré FR ; risque juridique accepté (voir `audience.md`).
- **Organisation du repo** : le travail Phase 2 de Florian vit dans **`Flo/`** ; l'associé crée son propre dossier pour son test. Les fichiers racine (CLAUDE.md, JOURNAL.md, data.csv, PLAN.md, .claude/context) restent communs.
- Page plan publiée : http://dash.secoursvert.net/plan.html

## En attente de Florian (bloquant V1)
1 NDD pilote + angle (recherche en cours) · clé API OpenAI (images) · accès serveur · données shops physiques (non bloquant pour le pilote : pages villes d'abord sur le top 30).

## Prochaines actions
1. Récupérer lien/coupon BC Bud Supply.
2. Surveiller les approbations en attente.
3. Configurer payout Low Price Bud.
4. Phase 2 V1 : schéma PostgreSQL + scraper (dans `Flo/`), puis génération, site pilote Astro (voir `v1.md`).
5. Sécurité : mdp en clair retirés et historique git purgé le 23/10/2026 (voir JOURNAL). Reste : nouveau mdp dashboard + re-chiffrement de index.html / secrets.enc, et rotation des mdp des comptes shops exposés (à faire par Florian, un humain saisit les mdp).
