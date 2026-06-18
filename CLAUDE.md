# PROJET : Affiliation Cannabis Canada — « Michelle Lanoy »

> **LIS CE FICHIER EN ENTIER avant d'agir, puis survole les dernières entrées de JOURNAL.md.**
> Ce repo est la **source de vérité unique** du projet, partagée entre Florian (vk) et son associé.
> Les deux travaillent chacun avec leur propre Claude **sans historique commun** : le git est le seul
> canal de mémoire partagée. Voir **§ Protocole de documentation partagée** (obligatoire).

## Objectif global
Monétiser du trafic SEO autour des shops de cannabis/CBD/graines/accessoires canadiens, via :
1. **Phase 1 (en cours)** — s'inscrire à tous les programmes d'affiliation et collecter les liens. Suivi dans le dashboard chiffré.
2. **Phase 2 (planifiée)** — bâtir un **réseau de 10 sites marchands** sur NDD expirés qui revendent les catalogues des shops affiliés (voir **PLAN.md**).

Identité utilisée :
- **Nom** : Michelle Lanoy · **Email** : michelle.lanoy.pro@gmail.com (boîte ouverte dans Chrome « Flo portable », compte u/5)
- Username standard : `michellelanoy` · Site déclaré : https://site-en-construction.com (placeholder)
- Pitch type : "SEO content and reviews about Canadian online cannabis and CBD shops (website currently in development)"

## Assets du projet
| Asset | URL | Accès |
|---|---|---|
| **Dashboard web (prod)** | http://dash.secoursvert.net (et https://florian-all-projects.github.io/dash-affil/) | mdp : demander à Florian (contenu chiffré AES) |
| **Page plan (prod)** | http://dash.secoursvert.net/plan.html | publique mais `noindex` (lien depuis le dashboard) |
| Repo GitHub | https://github.com/florian-all-projects/dash-affil (branche `main`) | Florian + associé |
| Ancien dashboard Netlify | ml-affil-dashboard.netlify.app (siteId 07705a90-111b-46d6-9372-ffab8792c045) | obsolète, à supprimer |
| Sheet comparatif (Drive) | docs.google.com/spreadsheets/d/1Onkn6TgXrjyLLJPRxv2uNaERkC7uAg7RDEVDZIua7bs | Drive Florian (plus lié depuis le dashboard) |
| Sheet identifiants (Drive) | docs.google.com/spreadsheets/d/1i07Ea82FNA7Sy1oyviLEUAp1rInsVB8sD1fybaQ1SNE | Drive Florian (plus lié depuis le dashboard) |
| Identifiants/mdp/coupons shops | `secrets.enc` (ce repo) | chiffré — voir § Déchiffrement |
| Tâche planifiée Cowork | « surveillance-emails-affiliation-cannabis » (**1×/jour à 9h**) | session Cowork de Florian |

## Fichiers du repo
- **`data.csv`** = base maîtresse : ~71 shops, commissions (1re vente / récurrente), cookie, seuil, paiement, DR Ahrefs, statut, démarche effectuée, notes. **Toute mise à jour du projet = mise à jour de data.csv.**
  - ⚠️ Deux colonnes distinctes : **« Statut »** = programme vérifié (`✅ Confirmé` ≠ compte actif) ; **« Démarche Michelle »** = état réel de l'inscription. Ne pas confondre.
- **`index.html`** = dashboard chiffré (AES-256-GCM + porte mot de passe WebCrypto, fallback noble pur-JS, `noindex`).
- **`plan.html`** = page publique (noindex) présentant PLAN.md, liée depuis le dashboard.
- **`PLAN.md`** = plan détaillé du réseau de sites marchands (Phase 2).
- **`generate.py`** = génère index.html. ⚠️ **NE PAS l'utiliser pour mettre à jour** (il n'a pas les liens/identifiants, qui ne sont pas dans data.csv → il les écraserait).
- **`secrets.enc`** = liens affiliés, identifiants, mots de passe, coupons (chiffrés AES, même mdp que le dashboard).
- **`JOURNAL.md`** = journal daté de toutes les actions.
- Déploiement : **commit/push sur `main` = mise en ligne auto (GitHub Pages)**, ~1 min.

## Mettre à jour le dashboard (index.html) — procédure
NE PAS régénérer avec generate.py. **Patcher le payload chiffré** :
1. Dans le sandbox, déchiffrer le payload (`const P = {"salt","nonce","ct"}`) avec le mdp dashboard (PBKDF2-SHA256, 310000 itérations, AES-256-GCM).
2. Modifier le HTML déchiffré (les `<tr>`, liens, dates…).
3. Re-chiffrer avec le **même salt + itérations** et un **nonce neuf**, remplacer `nonce` et `ct` dans index.html.
4. **Vérifier par round-trip** (re-déchiffrer le nouveau fichier) avant de pousser.
5. Pousser via l'**upload web** github.com/florian-all-projects/dash-affil/upload/main → glisser le fichier → « Commit changes » (l'API tree-save échoue en 422).
   - ⚠️ L'upload web peut parfois **caler** (« Uploading 1 of 1 ») ; réessayer / vérifier la connexion. Dossier de staging local : `dash-affil-upload\`.

## Déchiffrement de secrets.enc (dans le sandbox)
```python
import json, base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
d=json.load(open('secrets.enc')); b=lambda s: base64.b64decode(s)
key=PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=b(d['salt']),iterations=310000).derive(b'MDP_FOURNI_EN_CHAT')
print(AESGCM(key).decrypt(b(d['nonce']), b(d['ct']), None).decode())
```
(Le payload de `index.html` utilise le **même schéma** : objet `const P` avec salt/nonce/ct, mêmes paramètres KDF.)

## État au 17/06/2026 (résumé — détail dans data.csv et JOURNAL.md)
🟢 **ACTIFS — liens affiliés obtenus :**
- Get Kush : https://getkush.cc/?ref=michellelanoy (7,5%)
- BMWO : https://buymyweedonline.cc/ref/michellelanoy/ (15% récurrent, lifetime)
- Ganja West : https://ganjawest.co?ref=73813 (7,5%)
- Low Price Bud : https://lowpricebud.co/?ref=michellelanoy (payout à configurer ; non obligatoire pour tracker)
- CBD2GO : https://cbd2go.co/ref/10651/ (10%, cookie 90j, E-transfer)
- The High Club : https://www.thehighclub.biz/ref/140/ (3% à vie, cookie 7j, EMT)
- CBD Magic : https://cbdmagic.co/cbd/1061/ (15% + 5% à vie + 5% tier2, lifetime)
- CBD2HEAL : https://cbd2heal.ca/heal/213/ + **coupon `MICHELLE20`** (15% + 5% à vie, lifetime)
- Quebec Cannabis Seeds : https://quebeccannabisseeds.com/?a_aid=mlanoy (20% + 5% sous-affiliés)
- Toronto Cannabis Seeds : https://torontocannabisseeds.com/?a_aid=mlanoy (couvert par le compte QCS)

📨 BC Bud Supply : plan de promo ENVOYÉ (15/06). Offre 15%, payout le 15, PayPal/BTC, contact affiliates@bcbudsupply.com. Attend approbation + lien + coupon perso.
⏳ En attente d'approbation : Grasscity (8% pending, Cloudflare), Kush Station, Chronic Farms, Green Affiliates (Crop King +6), True North Seed Bank, Green Avenger (demande envoyée 16/06).
✅ Inscrits/comptes créés sans lien : Herbies, Speed Greens, WTF Cannabis (10%→5% à vie, soumis pending), Cannaffex, Plant of Life.
⏸ Bloqués : Haute Health (tél + pièce ID), POTV/CBD Oil Canada/Happy Bears (comptes Refersion à créer).
⛔ Morts/cassés : BuyWeedPacks, Vaped.ca, Resolve (GRIN), Birch+Fog, BC Seeds, Goldbuds.

## Infra & décisions techniques
- Dashboard migré **Netlify → GitHub Pages** (repo dash-affil) + CNAME o2switch `dash` → florian-all-projects.github.io (A/TXT supprimés). DNS vérifié correct (IPs 185.199.108-111.153).
- **Le site reste volontairement en HTTP.** GitHub n'a pas émis le certificat (DNS check bloqué « in progress ») et — décision de Florian (17/06) — **on n'active PAS Enforce HTTPS**, car passer en `https://` changerait l'origine et **réinitialiserait le `localStorage`** (vues enregistrées + disposition mémorisée du dashboard). Si bascule HTTPS un jour : prévenir que les vues seront à ré-enregistrer.
- Sauvegarde des vues du dashboard : **fonctionne** (localStorage de l'origine `http://dash.secoursvert.net`). Si elles « disparaissent » : c'est un changement d'URL/origine (ancienne adresse Netlify/github.io vs domaine), pas un bug.
- Compte Netlify : **crédit de build épuisé** → déploiements Netlify refusés (« account credit usage exceeded »). On héberge sur GitHub Pages.

## Prochaines étapes
1. Récupérer le lien + coupon de BC Bud Supply dès leur réponse.
2. Surveiller les approbations : Grasscity (8%), Kush Station, Chronic Farms, Green Affiliates, True North, Green Avenger.
3. Configurer le moyen de paiement Low Price Bud (onglet Payments) pour encaisser.
4. ⚠️ **SÉCURITÉ (non résolu)** : `JOURNAL.md` (repo PUBLIC) contient des mots de passe en clair hérités d'anciennes sessions → purger l'historique et ne garder les secrets que dans `secrets.enc`. **Ne plus jamais écrire de secret en clair.**
5. Phase 2 — réseau de sites marchands : voir **PLAN.md**. En attente de Florian : 10 NDD + angles, clés API (Gemini nano banana / GPT Image), données shops physiques, accès serveur, budget IA.

## Protocole de documentation partagée (OBLIGATOIRE pour TOUT Claude)
Deux personnes mènent ce projet, chacune avec son Claude sans historique partagé. **Le repo git est la seule mémoire commune.** Donc, pour que l'autre soit toujours au courant des modifs, process et techniques :
1. **Au démarrage de chaque session** : lire ce CLAUDE.md en entier + les dernières entrées de JOURNAL.md avant toute action.
2. **Après chaque action significative** (modif technique, nouveau lien/coupon, changement de statut, décision, fichier créé/modifié, déploiement) :
   - Ajouter une entrée **datée en haut de JOURNAL.md** : `## JJ/MM/AAAA (HHhMM) — Claude (session X)` puis le **quoi + le comment/pourquoi** (commandes, pièges, raisons), pas seulement le résultat.
   - Mettre à jour la section **« État »** de ce CLAUDE.md si l'état global change, et **data.csv** si un statut shop change.
3. **Pousser sur `main`** (GitHub Pages redéploie). Vérifier que le commit est bien passé.
4. **Toujours documenter le COMMENT** (technique, étapes reproductibles) pour que l'autre Claude puisse reprendre sans deviner.
5. **Ne jamais committer de secret en clair** (mdp, tokens) → uniquement dans `secrets.enc`.
6. **Ne jamais saisir de mot de passe dans un formulaire** (l'humain le fait) ; ne pas cocher les CAPTCHA.
