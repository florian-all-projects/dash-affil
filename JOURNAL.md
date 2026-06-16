# Journal du projet (ajouter en haut)

## 16/06/2026 (09h25) — Claude (tâche planifiée « surveillance-emails-affiliation-cannabis »)
- Surveillance boîte michelle.lanoy.pro@gmail.com (in:anywhere newer_than:2d). 2 nouveautés depuis le dernier run (15/06 18h) :
- **CBD Magic : candidature APPROUVÉE** (email « Welcome to the CBD Magic Team », 15/06 20h07, de sales@cbdmagic.co). Le mail fournit directement le **lien affilié : https://cbdmagic.co/cbd/1061/** (username michellelanoy). Espace affilié : https://cbdmagic.co/affiliate-area/. Statut data.csv : ✅ Soumis → 🟢 ACTIF — lien obtenu. Conditions : 15% + 5% à vie + 5% tier2, cookie 30j, E-transfer/PayPal 1re semaine.
- **CBD2HEAL : candidature APPROUVÉE** (email « Congratulations! Your Affiliate Application has been accepted », 15/06 20h08, de sales@cbd2heal.ca). Accès espace affilié : https://cbd2heal.ca/affiliate-area/ — le lien affilié n'est PAS dans le mail, à récupérer après connexion. Statut data.csv : ✅ Soumis → 🟢 Approuvé — accès espace affilié. Conditions : 15% + 5% à vie + 5% tier2, cookie 30j, coupon 20%.
- **BC Bud Supply : RAS** — le fil contient seulement leur réponse du 12/06 et le plan de promo envoyé par Michelle le 15/06 14h (déjà journalisé). Pas de nouvelle réponse de BCBS → toujours en attente d'approbation.
- The High Club : les 2 mails (approbation + « being reviewed ») apparaissent dans la recherche mais sont déjà traités (run 15/06).
- ⚠️ index.html NON régénéré (comme au run précédent) : `generate.py` ne réinjecte pas les liens/identifiants patchés → régénérer écraserait les 6 liens affiliés actifs. Le payload chiffré doit être patché à la main pour faire apparaître CBD Magic (ID 1061) et l'approbation CBD2HEAL sur le dashboard. TODO humain : patch payload + récupérer le lien CBD2HEAL via login.
- data.csv + JOURNAL.md mis à jour et poussés sur le repo.

## 15/06/2026 (18h15) — Claude (session Florian)
- The High Club : connexion à l'espace affilié OK (après approbation 16h) → LIEN AFFILIÉ RÉCUPÉRÉ : https://www.thehighclub.biz/ref/140/ (ID affilié 140). Statut passé à 🟢 ACTIF. index.html (payload patché) + data.csv + secrets.enc mis à jour. → 6 liens affiliés actifs (Get Kush, BMWO, Ganja West, LPB, CBD2GO, The High Club)

## 15/06/2026 (18h) — Claude (tâche planifiée « surveillance-emails-affiliation-cannabis »)
- Surveillance boîte michelle.lanoy.pro@gmail.com (in:anywhere newer_than:2d). 2 développements nouveaux :
- **The High Club : candidature APPROUVÉE** (email « Affiliate Application Accepted », 15/06 16h00). Espace affilié : https://www.thehighclub.biz/affiliate-area/ — statut data.csv passé de 🟡 en attente → 🟢 Approuvé. TODO humain : se connecter (identifiants dans secrets.enc) et récupérer le lien affilié. (Un email intermédiaire « Your Affiliate Application Is Being Reviewed » reçu à 12h39, désormais caduc.)
- **BC Bud Supply : plan de promo ENVOYÉ** par Michelle (15/06 14h00) en réponse à leur offre (15 %, payout le 15, PayPal/BTC). En attente de l'approbation BCBS + lien/coupon perso. Statut démarche mis à jour.
- data.csv mis à jour et poussé. ⚠️ index.html NON régénéré volontairement : `generate.py` ne réinjecte pas les identifiants/liens patchés dans le payload chiffré — régénérer écraserait les liens affiliés (Get Kush, BMWO, Ganja West, LPB, CBD2GO) et identifiants. Le payload doit être patché à la main pour faire apparaître l'approbation The High Club sur le dashboard.
- ⚠️ SÉCURITÉ : ce repo est PUBLIC et JOURNAL.md contient des mots de passe en clair (comptes shops + mot de passe du dashboard) issus de sessions précédentes. Recommandation : purger l'historique et déplacer tous les secrets dans secrets.enc.

## 15/06/2026 (13h) — Claude (session Florian)
- CBD2GO : mot de passe réinitialisé + connexion à l'espace affilié OK → LIEN AFFILIÉ RÉCUPÉRÉ : https://cbd2go.co/ref/10651/ (ID affilié 10651). Identifiants : michellelanoy / Mlanoy#C2G-2026!d4 (ajoutés à secrets.enc). Statut passé à 🟢 ACTIF. Avec Get Kush, BMWO, Ganja West, Low Price Bud : 5 liens affiliés actifs
- data.csv + index.html (payload patché) + secrets.enc mis à jour et poussés → GitHub Pages redéploie dash.secoursvert.net

## 15/06/2026 (11h) — Claude (session Florian)
- The High Club : INSCRIT au programme Ambassador (thehighclub.biz/ambassador-program/) — compte créé, statut « en attente d'approbation ». Conditions : 3% à vie, cookie 7 jours, paiement EMT (Interac). Identifiants ajoutés à secrets.enc (Mlanoy#THC-2026!w8). Lien affilié à récupérer après approbation
- CBD2GO : candidature affiliée ACCEPTÉE (email 12/06) — espace affilié cbd2go.co/affiliate-area/. TODO : récupérer le lien affilié + définir le mot de passe
- data.csv + index.html (dashboard chiffré, patch du payload) + secrets.enc mis à jour et poussés sur le repo → GitHub Pages redéploie dash.secoursvert.net

## 12/06/2026 (16h45) — Claude (session Florian)
- Cloudflare débloqués par Florian → LIENS RÉCUPÉRÉS : Ganja West https://ganjawest.co?ref=73813 (7,5%) et Low Price Bud https://lowpricebud.co/?ref=michellelanoy. Avec BMWO et Get Kush : 4 liens actifs
- Grasscity : correction — le compte plateforme est actif mais la candidature au programme 8% est encore « Pending » (générateur de liens verrouillé). L'email du matin n'était qu'une bienvenue
- Tous les emails du projet ouverts un par un (inbox + spam) ; restent des notifs LinkedIn sans rapport
- TODO : payout LPB à configurer ; surveiller approbations Grasscity/CBD Magic/CBD2HEAL/Kush Station/Chronic Farms ; BC Bud Supply attend le plan de promo

## 12/06/2026 (16h05) — Claude (session Florian)
- BMWO : LIEN AFFILIÉ RÉCUPÉRÉ (session active dans l'affiliate area) → ajouté au dashboard + secrets.enc
- Emails : tout vérifié (boîte + spam). Rien de nouveau hors Grasscity validé. Herbies : aucun email reçu — candidature partnership toujours en attente
- Cloudflare bloque Low Price Bud / Ganja West / Grasscity (affiliates.) : clic humain requis puis extraction des liens

## 12/06/2026 (15h45) — Claude (session Florian)
- FIX affichage : la porte mdp restait visible avec le tableau superposé (quirk document.write) → remplacement par DOMParser+replaceChild, et écran « Déchiffrement en cours… » au chargement (plus de page blanche avec « rester connecté »)
- generate.py mis à jour avec le nouveau template + fallback.js (bundle noble) ; ⚠️ generate.py ne réinjecte pas les identifiants/liens (data.csv public) → patcher le payload plutôt que régénérer
- Grasscity : programme AFFILIÉ VALIDÉ (email 12/06 09h41) — lien à récupérer sur affiliates.grasscity.com (Cloudflare, connexion manuelle)
- Liens affiliés encore à récupérer : Ganja West, Low Price Bud, Grasscity (Cloudflare → clic Florian), Herbies (login Florian), BMWO (login). Get Kush ✅ déjà dans la page

## 12/06/2026 (après-midi) — Claude (session Florian)
- FIX mot de passe dashboard : en HTTP (cert HTTPS GitHub pas encore émis), WebCrypto est indisponible → ajout d'un fallback pur-JS (@noble/ciphers + @noble/hashes, bundle esbuild, window.nobleDecrypt) dans index.html. Testé OK en live : canaweed2025! déchiffre (compter ~20-30 s en HTTP, instantané une fois en HTTPS)
- DNS o2switch fait : CNAME dash → florian-all-projects.github.io (A et TXT supprimés). Site live sur dash.secoursvert.net
- TODO : cocher « Enforce HTTPS » dans Settings > Pages quand le certificat sera émis ; supprimer ensuite l'ancien site Netlify ml-affil-dashboard

## 12/06/2026 — Claude (session Florian)
- Migration dashboard Netlify → GitHub Pages (repo dash-affil) ; CNAME dash.secoursvert.net préparé (DNS o2switch à faire)
- Get Kush : affilié ACTIVÉ, lien récupéré (https://getkush.cc/?ref=michellelanoy)
- Emails vérifiés : BC Bud Supply a répondu (15 %, payout le 15, PayPal/BTC, attend plan de promo) ; comptes confirmés Get Kush/BMWO(spam)/Grasscity/Ganja West ; CBD