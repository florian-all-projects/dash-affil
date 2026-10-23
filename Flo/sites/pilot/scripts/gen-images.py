"""Génère des images avec l'API OpenAI (GPT Image) et les enregistre en WebP 704 px.

Usage :
  python3 scripts/gen-images.py jobs.json
jobs.json : [{"out": "public/img/cat/flower.webp", "prompt": "...", "model": "gpt-image-1.5", "quality": "medium"}]
Clé : OPENAI_API_KEY dans l'environnement (jamais commitée). Les images déjà présentes ne sont pas régénérées.
"""
import base64, io, json, os, sys, urllib.request
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

if __name__ == "__main__":
    jobs = json.load(open(sys.argv[1]))
    for j in jobs:
        try:
            print(j["out"], generate(j), flush=True)
        except urllib.error.HTTPError as e:
            print(j["out"], "ERREUR", e.code, e.read().decode()[:300], flush=True)
