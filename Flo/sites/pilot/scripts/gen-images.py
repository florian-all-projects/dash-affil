"""Génère des images avec l'API OpenAI (GPT Image) et les enregistre en WebP 704 px.

Usage :
  python3 scripts/gen-images.py jobs.json
jobs.json : [{"out": "public/img/cat/flower.webp", "prompt": "...", "model": "gpt-image-1.5", "quality": "medium"}]
Clé : OPENAI_API_KEY dans l'environnement (jamais commitée). Les images déjà présentes ne sont pas régénérées.
"""
import base64, io, json, os, sys, urllib.error, urllib.request
from PIL import Image

KEY = os.environ["OPENAI_API_KEY"]
STYLE = (
    "Editorial studio product photograph. Background: plain soft sage-green paper (#E3EAE5) with gentle shadow. "
    "Natural daylight from the left, shallow depth of field, crisp detail, muted natural colours. "
    "No text, no letters, no logos, no brand packaging, no people, no hands, no smoke clouds."
)

def generate(job):
    out = job["out"]
    if os.path.exists(out):
        return "skip"
    body = {
        "model": job.get("model", "gpt-image-1.5"),
        "prompt": f"{job['prompt']} {STYLE}",
        "size": "1024x1024",
        "quality": job.get("quality", "medium"),
        "n": 1,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    img = Image.open(io.BytesIO(base64.b64decode(data["data"][0]["b64_json"]))).convert("RGB")
    img = img.resize((704, 704), Image.LANCZOS)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "WEBP", quality=82, method=6)
    return f"ok {os.path.getsize(out)//1024} Ko, usage={data.get('usage')}"

def run(j):
    try:
        return j["out"], generate(j)
    except urllib.error.HTTPError as e:
        return j["out"], f"ERREUR {e.code} {e.read().decode()[:300]}"
    except Exception as e:  # réseau, délai dépassé…
        return j["out"], f"ERREUR {e}"

if __name__ == "__main__":
    from concurrent.futures import ThreadPoolExecutor
    jobs = json.load(open(sys.argv[1]))
    # 4 requêtes en parallèle : reste sous les limites de débit OpenAI d'un compte standard
    with ThreadPoolExecutor(max_workers=4) as pool:
        for out, msg in pool.map(run, jobs):
            print(out, msg, flush=True)
