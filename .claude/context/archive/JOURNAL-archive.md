# Archive condensée du JOURNAL (1 ligne par entrée, plus récentes en haut)

- 12/06 — BMWO : LIEN AFFILIÉ RÉCUPÉRÉ (session active dans l'affiliate area) → ajouté au dashboard + secrets.enc Emails : tout vérifié (boîte + spam).
- 12/06 — FIX affichage : la porte mdp restait visible avec le tableau superposé (quirk document.write) → remplacement par DOMParser+replaceChild, et écran « Déchiffrement en cours… » au chargement (plus de pag
- 12/06 — FIX mot de passe dashboard : en HTTP (cert HTTPS GitHub pas encore émis), WebCrypto est indisponible → ajout d'un fallback pur-JS (@noble/ciphers + @noble/hashes, bundle esbuild, window.nobleDecrypt) 
- 12/06 — Migration dashboard Netlify → GitHub Pages (repo dash-affil) ;
