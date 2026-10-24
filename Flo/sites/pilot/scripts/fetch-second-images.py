"""Télécharge une 2e photo par produit (galerie de la fiche du shop) pour la galerie des fiches Budboard.

Source : src/data/generated/gallery.json (offer_id, position, url), rempli par Flo/scraper/scripts/collect-variants.ts.
On prend l'offre dont vient déjà la photo principale (shop-images.json), et la première image de sa galerie qui n'est
pas la photo principale. Sortie : public/img/s2/<slug>.webp (non versionné) + src/data/generated/second-images.json.
Les boutiques qui bloquent les robots (403) sont simplement ignorées : on ne contourne pas leurs protections.
Usage : python3 scripts/fetch-second-images.py   (après npm run data et fetch-shop-images.py)
"""
import io, json, os, sys, urllib.parse, urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
GEN = os.path.join(ROOT, "src", "data", "generated")
OUT = os.path.join(ROOT, "public", "img", "s2")
os.makedirs(OUT, exist_ok=True)
products = {p["id"]: p for p in json.load(open(os.path.join(GEN, "products.json")))}
offers = json.load(open(os.path.join(GEN, "offers.json")))
main = json.load(open(os.path.join(GEN, "shop-images.json")))
gallery = defaultdict(list)
for g in json.load(open(os.path.join(GEN, "gallery.json"))):
    gallery[g["offer_id"]].append((g["position"], g["url"]))
base = lambda u: os.path.basename(urllib.parse.urlsplit(u or "").path).rsplit(".", 1)[0].rsplit("-", 1)[0].lower()

jobs = {}
for o in offers:
    pid = o["product_id"]
    if pid in jobs or not gallery.get(o["id"]):
        continue
    m = main.get(str(pid))
    if m and m["shop"] != o["shop_id"]:
        continue  # même boutique que la photo principale, pour une galerie cohérente
    imgs = [u for _, u in sorted(gallery[o["id"]])]
    second = next((u for u in imgs[1:] if base(u) != base(o.get("image_url")) and base(u) != base(imgs[0])), None)
    if second:
        jobs[pid] = second

def fetch(item):
    pid, url = item
    slug = products.get(pid, {}).get("slug")
    if not slug:
        return pid, None
    path = os.path.join(OUT, f"{slug}.webp")
    if os.path.exists(path):
        return pid, f"/img/s2/{slug}.webp"
    try:
        parts = urllib.parse.urlsplit(url)
        url = urllib.parse.urlunsplit(parts._replace(path=urllib.parse.quote(parts.path, safe="/%")))
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; BudboardBot/1.0; price comparison)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
        im.thumbnail((600, 600), Image.LANCZOS)
        bg = Image.new("RGB", (600, 600), (255, 255, 255))
        bg.paste(im, ((600 - im.width) // 2, (600 - im.height) // 2), im if im.mode == "RGBA" else None)
        bg.save(path, "WEBP", quality=76, method=5)
        return pid, f"/img/s2/{slug}.webp"
    except Exception as e:
        print("échec", slug, str(e)[:100], file=sys.stderr)
        return pid, None

with ThreadPoolExecutor(max_workers=6) as pool:
    res = {str(k): v for k, v in pool.map(fetch, jobs.items()) if v}
json.dump(res, open(os.path.join(GEN, "second-images.json"), "w"))
print(f"{len(res)}/{len(jobs)} deuxièmes photos prêtes dans public/img/s2/")
