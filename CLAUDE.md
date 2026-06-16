# PROJET : Affiliation Cannabis Canada — « Michelle Lanoy »

> **LIS CE FICHIER EN ENTIER avant d'agir.** Ce repo est la source de vérité du projet,
> partagée entre Florian (vk) et son associé. Chaque session Claude (sans historique)
> doit pouvoir reprendre le projet à partir d'ici. **Mets à jour JOURNAL.md et data.csv
> après chaque action significative, et régénère/commit index.html.**

## Objectif
Monétiser du trafic SEO en s'inscrivant à tous les programmes d'affiliation des shops
de cannabis/CBD/graines/accessoires canadiens, sous l'identité :
- **Nom** : Michelle Lanoy · **Email** : michelle.lanoy.pro@gmail.com (boîte ouverte dans Chrome « Flo portable », compte u/5)
- Username standard : `michellelanoy` · Site déclaré : https://site-en-construction.com (placeholder)
- Pitch type : "SEO content and reviews about Canadian online cannabis and CBD shops (website currently in development)"

## Assets du projet
| Asset | URL | Accès |
|---|---|---|
| **Dashboard web (prod)** | https://dash.secoursvert.net (et https://florian-all-projects.github.io/dash-affil/) | mdp : demander à Florian (contenu chiffré AES) |
| Ancien dashboard Netlify | https://ml-affil-dashboard.netlify.app (siteId 07705a90-111b-46d6-9372-ffab8792c045) | à supprimer après bascule DNS |
| Sheet comparatif | https://docs.google.com/spreadsheets/d/1Onkn6TgXrjyLLJPRxv2uNaERkC7uAg7RDEVDZIua7bs | Drive Florian |
| Sheet identifiants | https://docs.google.com/spreadsheets/d/1i07Ea82FNA7Sy1oyviLEUAp1rInsVB8sD1fybaQ1SNE | Drive Florian |
| Identifiants/mdp shops | `secrets.enc` (ce repo) | chiffré — voir § Déchiffrement |
| Tâche planifiée Cowork | « surveillance-emails-affiliation-cannabis » (2x/jour 9h/18h) | session Cowork de Florian |

## Données
- **`data.csv`** = base maîtresse : ~71 shops, commissions (1re vente / récurrente), cookie, seuil,
  paiement, DR Ahrefs, statut, démarche effectuée, notes. **Toute mise à jour du projet = mise à jour de data.csv.**
- **`generate.py`** = génère `index.html` (dashboard chiffré : filtres, tri, colonnes déplaçables,
  vues localStorage, boutons copier ID/mdp). Usage : `python3 generate.py --password 'LE_MDP'`
  (le mot de passe du dashboard est fourni par Florian en chat — ne jamais le committer en clair).
- **`index.html`** = dashboard généré (contenu AES-256-GCM + porte de mot de passe WebCrypto, noindex).
- Déploiement : **commit/push sur main = mise en ligne auto (GitHub Pages)**.
- ⚠️ Mise à jour du dashboard : NE PAS régénérer index.html avec generate.py (efface liens/identifiants) — **patcher le payload chiffré** (déchiffrer avec le mdp dashboard, modifier les `<tr>`, re-chiffrer). Push via l'**upload web** github.com/.../upload/main + file_upload + « Commit changes » (l'API tree-save échoue en 422).

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

## État au 15/06/2026 (résumé — détail dans data.csv et JOURNAL.md)
- 🟢 ACTIFS — 6 liens affiliés obtenus :
  - Get Kush : https://getkush.cc/?ref=michellelanoy (7,5%)
  - BMWO : https://buymyweedonline.cc/ref/michellelanoy/ (15% récurrent)
  - Ganja West : https://ganjawest.co?ref=73813 (7,5%)
  - Low Price Bud : https://lowpricebud.co/?ref=michellelanoy (payout à configurer)
  - CBD2GO : https://cbd2go.co/ref/10651/ (10%, cookie 90j, E-transfer) — approuvé 12/06, lien récupéré 15/06
  - The High Club : https://www.thehighclub.biz/ref/140/ (3% à vie, cookie 7j, EMT) — Ambassador approuvé 15/06
- 📨 BC Bud Supply : plan de promo ENVOYÉ (15/06). Offre 15%, payout le 15, PayPal/BTC. Attend leur approbation + lien + coupon perso
- ⏳ En attente d'approbation (à surveiller) : Grasscity (programme 8% pending, générateur verrouillé, Cloudflare), CBD Magic, CBD2HEAL (en examen), Kush Station, Chronic Farms
- ✅ Comptes créés sans lien encore : Herbies, Speed Greens + inscriptions soumises : WTF Cannabis, Cannaffex, Plant of Life
- ⏸ Bloqués : seed banks Green Affiliates/True North/QCS/Toronto/Green Avenger (adresse + tél + banque requis), Haute Health (tél + pièce d'identité), POTV/CBD Oil Canada/Happy Bears (comptes Refersion à créer)
- ⛔ Morts/cassés : BuyWeedPacks (domaine en vente), Vaped.ca (404), Resolve (GRIN abandonné), Birch+Fog, BC Seeds, Goldbuds (fermé)

## Prochaines étapes
1. Récupérer le lien + coupon de BC Bud Supply dès leur réponse
2. Surveiller les approbations : Grasscity (8%), CBD Magic, CBD2HEAL, Kush Station, Chronic Farms
3. Configurer le moyen de paiement Low Price Bud (onglet Payments) pour pouvoir encaisser
4. ⚠️ SÉCURITÉ : purger les mots de passe en clair de l'historique de JOURNAL.md (repo PUBLIC) et ne garder les secrets que dans secrets.enc
5. Finaliser HTTPS (cocher « Enforce HTTPS » dans Settings > Pages quand le certificat est émis) puis supprimer l'ancien site Netlify ml-affil-dashboard
6. Seed banks dès que Florian fournit adresse postale + téléphone

## Règles pour Claude
- Ne jamais committer de mot de passe en clair (utiliser secrets.enc)
- Ne jamais saisir de mot de passe dans un formulaire (l'humain le fait) ; ne pas cocher les CAPTCHA
- Toute action faite = ligne dans JOURNAL.md (date, qui, quoi) + data.csv à jour + index.html régénéré + push
