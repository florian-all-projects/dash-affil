"""Prépare l'annuaire des magasins de cannabis autorisés pour D1 (tables cities + physical_shops).

Entrée : le CSV produit par les scripts de collecte (registres officiels des provinces, voir README.md de ce dossier).
Sortie : un fichier SQL à appliquer avec  npx wrangler d1 execute cana-catalog --remote --yes --file <sortie>

Usage : python3 Flo/stores/load_stores.py <stores.csv> <sortie.sql>
"""
import csv, re, sys, unicodedata

SRC, OUT = sys.argv[1], sys.argv[2]

# Anciennes municipalités ou quartiers écrits par les registres -> ville actuelle (fusions municipales)
MERGE = {
    "ON": {
        "Toronto": ["Scarborough", "North York", "Etobicoke", "East York", "York"],
        "Ottawa": ["Nepean", "Kanata", "Orleans", "Orléans", "Gloucester", "Vanier", "Stittsville", "Barrhaven", "Manotick", "Greely",
                   "Cumberland", "Navan", "Carp", "Richmond", "Osgoode", "Metcalfe", "Kars", "North Gower", "Dunrobin", "Constance Bay", "Blackburn Hamlet"],
        "Hamilton": ["Stoney Creek", "Ancaster", "Dundas", "Flamborough", "Glanbrook", "Binbrook", "Waterdown", "Mount Hope"],
        "Greater Sudbury": ["Sudbury"],
    },
    "QC": {
        "Montréal": ["Lachine", "Lasalle", "LaSalle", "Verdun", "Saint-Laurent", "Anjou", "Montréal-Nord", "Saint-Léonard", "Pierrefonds", "Rivière-Des-Prairies", "Montreal"],
        "Saguenay": ["Chicoutimi", "Jonquière", "La Baie"],
        "Longueuil": ["Saint-Hubert", "Greenfield Park"],
        "Gatineau": ["Hull", "Aylmer"],
        "Québec": ["Charlesbourg", "Beauport", "Sainte-Foy", "Loretteville", "Quebec", "Quebec City"],
    },
}
ALIAS = {(p, old): new for p, m in MERGE.items() for new, olds in m.items() for old in olds}

# Décision de Florian (24/10/2026) : toutes les provinces récupérées sont publiées, PEI comprise (risque sur les droits accepté)
EXCLUDED_SOURCES: set = set()

ACRONYMS = {"BC", "CBD", "THC", "AGLC", "SQDC", "NLC", "YYC", "YEG", "YYZ", "YOW", "YVR", "ON", "AB", "SK", "MB", "NW", "NE", "SW", "SE", "II", "III", "IV", "PEI", "RR", "HWY", "4/20", "420", "KC", "ID", "OG", "MJ", "LTD", "INC"}
KEEP_LOWER = {"and", "of", "the", "de", "du", "des", "la", "le", "et"}

def smart_title(s: str) -> str:
    """Les registres écrivent souvent en capitales : « SPIRIT LEAF » -> « Spirit Leaf », sans casser les sigles."""
    if not s or not s.isupper():
        return s
    out = []
    for i, w in enumerate(s.split(" ")):
        core = re.sub(r"[^A-Z0-9/]", "", w)
        if core in ACRONYMS or re.search(r"\d", w):  # sigles, numéros civiques et unités (« 4A-1861 ») inchangés
            out.append(w)
        elif i > 0 and w.lower() in KEEP_LOWER:
            out.append(w.lower())
        else:
            out.append(w.capitalize() if "-" not in w else "-".join(x.capitalize() for x in w.split("-")))
    return " ".join(out)

def slugify(s: str) -> str:
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower().replace("&", " and ").replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

esc = lambda v: "NULL" if v in (None, "") else "'" + str(v).replace("'", "''") + "'"
num = lambda v: "NULL" if v in (None, "") else str(float(v))

rows = [r for r in csv.DictReader(open(SRC, encoding="utf-8")) if r["source"] not in EXCLUDED_SOURCES]
cities = {}
stores = []
for r in rows:
    prov = r["province_code"]
    city = ALIAS.get((prov, r["city"]), r["city"])
    slug = slugify(city)
    if prov == "QC" and slug == "quebec":
        slug = "quebec-city"  # la ville, pas la province
    key = (prov, slug)
    if key not in cities:
        en = {"montreal": "Montreal", "quebec-city": "Quebec City"}.get(slug, city)
        cities[key] = {"province": prov, "slug": slug, "name": en, "name_fr": city if prov == "QC" else en}
    stores.append((key, r))

sql = ["DELETE FROM physical_shops;", "DELETE FROM cities;"]
for (prov, slug), c in sorted(cities.items()):
    sql.append(f"INSERT INTO cities (province, slug, name, name_fr) VALUES ({esc(prov)}, {esc(slug)}, {esc(c['name'])}, {esc(c['name_fr'])});")
for (prov, slug), r in stores:
    sql.append(
        "INSERT INTO physical_shops (city_id, name, address, postal_code, phone, website, lat, lng, source, source_url, retrieved_at) VALUES ("
        f"(SELECT id FROM cities WHERE province = {esc(prov)} AND slug = {esc(slug)}), {esc(smart_title(r['name']))}, {esc(smart_title(r['address']))}, "
        f"{esc(r['postal_code'])}, {esc(r['phone'])}, {esc(r['website'])}, {num(r['lat'])}, {num(r['lon'])}, {esc(r['source'])}, {esc(r['source_url'])}, {esc(r['retrieved_at'])});"
    )
open(OUT, "w", encoding="utf-8").write("\n".join(sql) + "\n")
print(f"{len(cities)} villes, {len(stores)} magasins -> {OUT}")
