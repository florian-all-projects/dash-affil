"""Télécharge la photo produit publiée par le shop (une par produit) et la convertit en WebP carré 600 px.

Choix de Florian (24/10/2026) : photos des shops pour le catalogue, images IA seulement pour les produits mis en avant.
Les fichiers vont dans public/img/s/ (non versionné : ce sont les photos des shops, retéléchargeables).
Usage : python3 scripts/fetch-shop-images.py   (après npm run data ; ne retélécharge pas les fichiers présents)
Sortie : src/data/generated/shop-images.json  {product_id: {"src": "/img/s/<slug>.webp", "shop": shop_id}}
"""
import io, json, os, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
GEN = os.path.join(ROOT, "src", "data", "generated")
OUT = os.path.join(ROOT, "public", "img", "s")
os.makedirs(OUT, exist_ok=True)
products = {p["id"]: p for p in json.load(open(os.path.join(GEN, "products.json")))}
shops = {s["id"]: s for s in json.load(open(os.path.join(GEN, "shops.json")))}
offers = json.load(open(os.path.join(GEN, "offers.json")))

# Une image par produit : celle du shop « à vie » s'il y en a un, sinon la première offre qui en a une
best = {}
for o in offers:
    if not o.get("image_url"):
        continue
    cur = best.get(o["product_id"])
    life = shops.get(o["shop_id"], {}).get("lifetime", 0)
    if cur is None or (life and not cur[1]):
        best[o["product_id"]] = (o["image_url"], life, o["shop_id"])

def fetch(item):
    pid, (url, _, shop_id) = item
    slug = products.get(pid, {}).get("slug")
    if not slug:
        return pid, None
    path = os.path.join(OUT, f"{slug}.webp")
    if os.path.exists(path):
        return pid, {"src": f"/img/s/{slug}.webp", "shop": shop_id}
    try:
        # URL avec caractères non ASCII (tirets typographiques…) : on encode le chemin
        parts = urllib.parse.urlsplit(url)
        url = urllib.parse.urlunsplit(parts._replace(path=urllib.parse.quote(parts.path, safe="/%")))
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; BudboardBot/1.0; price comparison)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
        # Carré 600 px, image entière (pas de recadrage des emballages), fond blanc
        im.thumbnail((600, 600), Image.LANCZOS)
        bg = Image.new("RGB", (600, 600), (255, 255, 255))
        bg.paste(im, ((600 - im.width) // 2, (600 - im.height) // 2), im if im.mode == "RGBA" else None)
        bg.save(path, "WEBP", quality=78, method=5)
        return pid, {"src": f"/img/s/{slug}.webp", "shop": shop_id}
    except Exception as e:  # image cassée ou bloquée : la fiche reprendra le visuel de catégorie
        print("échec", slug, str(e)[:120], file=sys.stderr)
        return pid, None

with ThreadPoolExecutor(max_workers=8) as pool:
    res = dict(r for r in pool.map(fetch, best.items()) if r[1])
json.dump(res, open(os.path.join(GEN, "shop-images.json"), "w"))
print(f"{len(res)}/{len(best)} images de shops prêtes dans public/img/s/")
