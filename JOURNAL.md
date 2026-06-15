# Journal du projet (ajouter en haut)

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
- generate.py mis à jour avec le nouveau template + fallback.js (bundle noble) ; ⚠️ generate.py ne réinjecte pas les identifiants/liens (data.csv public) — patcher le payload plutôt que régénérer
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