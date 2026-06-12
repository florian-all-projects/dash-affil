# Journal du projet (ajouter en haut)

## 12/06/2026 (après-midi) — Claude (session Florian)
- FIX mot de passe dashboard : en HTTP (cert HTTPS GitHub pas encore émis), WebCrypto est indisponible → ajout d'un fallback pur-JS (@noble/ciphers + @noble/hashes, bundle esbuild, window.nobleDecrypt) dans index.html. Testé OK en live : canaweed2025! déchiffre (compter ~20-30 s en HTTP, instantané une fois en HTTPS)
- DNS o2switch fait : CNAME dash → florian-all-projects.github.io (A et TXT supprimés). Site live sur dash.secoursvert.net
- TODO : cocher « Enforce HTTPS » dans Settings > Pages quand le certificat sera émis ; supprimer ensuite l'ancien site Netlify ml-affil-dashboard

## 12/06/2026 — Claude (session Florian)
- Migration dashboard Netlify → GitHub Pages (repo dash-affil) ; CNAME dash.secoursvert.net préparé (DNS o2switch à faire)
- Get Kush : affilié ACTIVÉ, lien récupéré (https://getkush.cc/?ref=michellelanoy)
- Emails vérifiés : BC Bud Supply a répondu (15 %, payout le 15, PayPal/BTC, attend plan de promo) ; comptes confirmés Get Kush/BMWO(spam)/Grasscity/Ganja West ; CBD Magic/CBD2HEAL/Kush Station en examen
- 9 emails de demande envoyés par Florian (CheapWeed, CBDNorth, Vitality, Mellow, High Club, CC9, ODC, Vancouver SB, Jordan)
- Dashboard : colonnes Com 1re vente / récurrente, lien conditions, liens affiliés, tri, filtres, vues localStorage, colonnes déplaçables, « rester connecté »

## 11/06/2026 — Claude (session Florian)
- Recherche complète : ~80 shops MOM/CBD/graines/accessoires, comparatif + DR Ahrefs → 2 Google Sheets
- Inscriptions/demandes : ~20 programmes (détail data.csv) ; comptes créés (LPB, Chronic Farms…) validés par Florian
- Tâche planifiée surveillance Gmail 2x/jour créée
