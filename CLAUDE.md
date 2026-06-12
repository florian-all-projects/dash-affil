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

## État au 12/06/2026 (résumé — détail dans data.csv et JOURNAL.md)
- 🟢 ACTIF : Get Kush (lien : https://getkush.cc/?ref=michellelanoy), Grasscity (compte ok, programme 8% pending)
- ✅ Comptes créés : Low Price Bud, BMWO, Herbies, Ganja West + inscriptions soumises : WTF Cannabis, Chronic Farms, Kush Station, The Herb Centre, Cannaffex, Plant of Life, CBD Magic, CBD2HEAL (en examen)
- 📨 Réponse reçue : **BC Bud Supply = 15 %, payout le 15, PayPal/BTC, lien + coupon perso** — attend un plan de promo pour approuver (répondre depuis la boîte de Michelle)
- 📧 Emails envoyés (12/06, en attente) : CheapWeed, CBDNorth, Vitality, Mellow, The High Club, Crystal Cloud 9, ODC, Vancouver Seed Bank, Jordan of the Islands
- ⏸ Bloqués : seed banks Green Affiliates/True North/QCS/Toronto/Green Avenger (adresse postale + tél + banque requis), Haute Health (tél + pièce d'identité), POTV/CBD Oil Canada/Happy Bears (comptes Refersion à créer)
- ⛔ Morts/cassés : BuyWeedPacks (domaine en vente), Vaped.ca (404), Resolve (GRIN abandonné), Birch+Fog, BC Seeds, Goldbuds (fermé), Daily Marijuana & Tools420 & Low Price Bud & Ganja West dashboards (Cloudflare → clic humain requis)

## Prochaines étapes
1. Répondre à BC Bud Supply (plan de promo) depuis la boîte de Michelle
2. Récupérer les liens affiliés restants (Ganja West, LPB, Herbies — sessions/Cloudflare)
3. Finaliser DNS dash.secoursvert.net (CNAME `dash` → `florian-all-projects.github.io` chez o2switch) puis custom domain dans Settings→Pages
4. Seed banks dès que Florian fournit adresse/téléphone
5. Surveiller la boîte Gmail (réponses CheapWeed, CBDNorth, Vitality, Mellow…) et mettre à jour data.csv + dashboard + JOURNAL.md

## Règles pour Claude
- Ne jamais committer de mot de passe en clair (utiliser secrets.enc)
- Ne jamais saisir de mot de passe dans un formulaire (l'humain le fait) ; ne pas cocher les CAPTCHA
- Toute action faite = ligne dans JOURNAL.md (date, qui, quoi) + data.csv à jour + index.html régénéré + push
