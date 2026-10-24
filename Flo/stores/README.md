# Annuaire des magasins de cannabis autorisés (pages villes)

Source : les **registres officiels** des régulateurs et détaillants provinciaux, rien d'autre (pas de Google, Yelp, Leafly,
Weedmaps ni OpenStreetMap). Collecte du 24/10/2026 : **3 809 magasins** chargés dans D1 (`cities`, `physical_shops`).

| Prov. | Magasins | Source |
|---|---|---|
| ON | 1 864 | AGCO, fichier de la carte des magasins « Authorized to Open » |
| AB | 756 | AGLC, recherche de titulaires de licence (détaillants) |
| BC | 551 | LCRB, liste des détaillants légaux (+ coordonnées de la carte LCRB) |
| MB | 252 | LGCA, liste des magasins |
| SK | 208 | SLGA, détenteurs de permis actifs |
| QC | 97 | SQDC, liste des baux au 30/03/2024 (localisateur en ligne bloqué) : les magasins ouverts depuis manquent |
| NL | 63 | NLC (CannabisNL), localisateur de magasins |
| NT | 7 | NTLCC |
| YT | 6 | yukon.ca (recopié à la main, à vérifier) |
| PE | 5 | PEI Cannabis (page contact) |
| NS, NB | 0 | NSLC et Cannabis NB bloquent les requêtes automatisées (challenge Cloudflare) |
| NU | 0 | pas de magasin physique (vente en ligne seulement) |

## Droits de réutilisation : décision de Florian (24/10/2026)
Aucune de ces listes n'est publiée sous licence ouverte (AGCO, AGLC, gouvernement de la C.-B., SLGA, NTLCC, Yukon et PEI Cannabis
interdisent la reproduction substantielle ou l'usage commercial sans autorisation écrite ; PEI interdit aussi l'extraction automatisée).
**Florian a décidé de publier les données de toutes les provinces récupérées** (« on s'en fout, utilise les données récupérées pour
toutes les provinces »). Le site crédite et lie chaque source sur les pages villes.

## Refaire la collecte
```bash
python3 -I Flo/stores/fetch_sources.py            # télécharge les registres dans Flo/stores/raw/ (poli : 1,5 s entre requêtes)
python3 -I Flo/stores/build_stores.py             # -> Flo/stores/stores.csv
python3 Flo/stores/load_stores.py Flo/stores/stores.csv /tmp/stores.sql   # fusions municipales (Scarborough -> Toronto…), casse
npx wrangler d1 execute cana-catalog --remote --yes --file /tmp/stores.sql
```
`load_stores.py` rattache les anciennes municipalités à la ville actuelle (Toronto, Ottawa, Hamilton, Montréal, Saguenay,
Longueuil, Gatineau, Québec) et remet en casse normale les noms écrits en capitales. Une ville a une page si elle compte
au moins 3 magasins, ou si c'est une grande ville ou une capitale (`src/lib/geo.ts` du site).
