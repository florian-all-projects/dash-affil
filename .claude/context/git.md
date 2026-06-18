# Git, déploiement & doc

## Repo
`github.com/florian-all-projects/dash-affil` (branche `main`). **Push sur main = déploiement auto GitHub Pages** (~1 min). Domaine : **http://dash.secoursvert.net** (CNAME o2switch).

## HTTP volontaire
On **reste en HTTP** : GitHub n'a pas émis le certificat (DNS check « in progress ») et passer en HTTPS changerait l'origine → réinitialiserait le `localStorage` (vues + disposition du dashboard). Ne pas activer « Enforce HTTPS » sans prévenir.

## Comment pousser
Upload web : `github.com/florian-all-projects/dash-affil/upload/main` (ou `/upload/main/<dossier>`), glisser les fichiers, « Commit changes » (l'API tree-save échoue en 422). L'upload peut parfois caler → réessayer.

## Dashboard chiffré (index.html)
NE PAS régénérer avec generate.py (écrase liens/identifiants absents de data.csv). **Patcher le payload chiffré** : déchiffrer (`const P` salt/nonce/ct, PBKDF2-SHA256 310000, AES-256-GCM, mdp dashboard) → éditer le HTML → re-chiffrer (même salt, nonce neuf) → **vérif round-trip** → upload.

## Secrets
`secrets.enc` (chiffré, même mdp) = liens/identifiants/mdp/coupons. **Ne jamais committer de secret en clair.** ⚠️ Le `JOURNAL.md` public contient encore d'anciens mdp en clair → à purger (TODO sécurité).

## Protocole de documentation partagée (OBLIGATOIRE)
Deux personnes, deux Claude sans historique commun → le git est la seule mémoire partagée.
1. Démarrage : lire `CLAUDE.md` + `.claude/context/index.md` + survol `JOURNAL.md`.
2. Après chaque action : entrée datée en haut de `JOURNAL.md` (quoi + **comment/pourquoi**), maj de l'« État » de CLAUDE.md / `progress.md` / data.csv si besoin.
3. Pousser sur main, vérifier le commit.

## Note environnement
Le mount sandbox (bash) peut être en léger décalage avec le filesystem des outils Read/Write ; pour l'upload navigateur, se fier aux fichiers Windows (Read/Write).
