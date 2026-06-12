#!/usr/bin/env python3
"""Génère index.html (dashboard chiffré) à partir de data.csv.
Usage: python3 generate.py --password 'MDP_DASHBOARD'
Dépendance: pip install cryptography --break-system-packages
Le HTML produit contient: porte de mdp (WebCrypto AES-GCM/PBKDF2-310000), noindex,
filtres (recherche/catégorie/statut), tri par clic, colonnes déplaçables (drag),
vues nommées + disposition persistée (localStorage), double scrollbar, boutons copier.
Après génération: commit + push -> GitHub Pages déploie automatiquement.
"""
import csv, html, json, base64, os, argparse
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

p=argparse.ArgumentParser(); p.add_argument('--password',required=True); p.add_argument('--csv',default='data.csv'); p.add_argument('--out',default='index.html')
a=p.parse_args()
rows=list(csv.DictReader(open(a.csv)))
HEADS=["Catégorie","Statut","DR","Shop (lien inscription)","Lien affilié","Conditions du programme","Com. 1ère vente","Com. récurrente / lifetime","Cookie","Seuil","Paiement","ID","Mot de passe","Inscription","Démarche Michelle","Restrictions","Notoriété","Notes"]
# NB: les colonnes ID/Mot de passe/Lien affilié sont remplies depuis les colonnes optionnelles
# du CSV si présentes (ID, MDP, LienAff) — sinon "—". Les mdp réels sont dans secrets.enc.
def cell(v): return html.escape(v or "—")
def copybtn(v):
    if not v or v.startswith("("): return cell(v) if v else "—"
    e=html.escape(v); return f'<span class="cred"><code>{e}</code><button class="cp" onclick="cp(this,\'{e}\')">📋</button></span>'
body=['<div class="wrap"><header><h1>🍁 Affiliation Cannabis Canada — Dashboard Michelle Lanoy</h1>']
import datetime
body.append(f'<p class="meta">Dernière mise à jour : <strong>{datetime.date.today().strftime("%d/%m/%Y")}</strong> · michelle.lanoy.pro@gmail.com · <a href="#" onclick="localStorage.removeItem(\'dashpw\');location.reload();return false">Se déconnecter</a><br>💡 Glisse les en-têtes pour réorganiser · clique pour trier · disposition mémorisée · vues nommées</p></header>')
cats=sorted(set(r["Catégorie"] for r in rows)); stats=sorted(set(r["Statut"] for r in rows))
body.append('<div class="filters"><input id="q" placeholder="🔍 Rechercher…" oninput="flt();saveLast()">')
body.append('<select id="fcat" onchange="flt();saveLast()"><option value="">Toutes catégories</option>'+''.join(f'<option>{html.escape(c)}</option>' for c in cats)+'</select>')
body.append('<select id="fstat" onchange="flt();saveLast()"><option value="">Tous statuts</option>'+''.join(f'<option>{html.escape(s)}</option>' for s in stats)+'</select>')
body.append('<select id="views" onchange="loadView(this.value)"><option value="">📂 Vues…</option></select><button class="btn" onclick="saveView()">💾 Enregistrer la vue</button><button class="btn" onclick="delView()">🗑</button><button class="btn" onclick="resetView()">↺ Reset</button><span id="count"></span></div>')
body.append('<div id="topscroll"><div id="topscroll-inner"></div></div>')
body.append('<div class="tablewrap" id="tw"><table id="t"><thead><tr>'+''.join(f'<th draggable="true">{h} <span class="arr"></span></th>' for h in HEADS)+'</tr></thead><tbody>')
for r in rows:
    link=r.get("Page affiliation",""); shop=f'<a href="{html.escape(link)}" target="_blank">{cell(r["Shop"])}</a>' if link.startswith("http") else cell(r["Shop"])
    cond=r.get("LienConditions") or (link if link.startswith("http") else "")
    condl=f'<a href="{html.escape(cond)}" target="_blank">Voir les conditions 🔗</a>' if cond else "—"
    tds=[f'<td>{cell(r["Catégorie"])}</td>',f'<td>{cell(r["Statut"])}</td>',f'<td data-n="{r["DR"] if (r["DR"] or "").replace(".","").isdigit() else -1}">{cell(r["DR"])}</td>',f'<td>{shop}</td>',f'<td>{copybtn(r.get("LienAff",""))}</td>',f'<td>{condl}</td>',f'<td>{cell(r.get("Com1") or r.get("Commission"))}</td>',f'<td>{cell(r.get("ComLife") or r.get("Lifetime"))}</td>',f'<td>{cell(r["Cookie"])}</td>',f'<td>{cell(r["Seuil"])}</td>',f'<td>{cell(r["Paiement"])}</td>',f'<td>{copybtn(r.get("ID",""))}</td>',f'<td>{copybtn(r.get("MDP",""))}</td>',f'<td>{cell(r["Inscription"])}</td>',f'<td>{cell(r["Démarche Michelle"])}</td>',f'<td>{cell(r["Conditions"])}</td>',f'<td>{cell(r["Notoriété"])}</td>',f'<td>{cell(r["Notes"])}</td>']
    body.append('<tr>'+''.join(tds)+'</tr>')
body.append('</tbody></table></div><footer><p>Page privée · noindex · contenu chiffré.</p></footer></div>')
N=len(HEADS)
body.append("<script>const NCOL="+str(N)+""";
let order=[...Array(NCOL).keys()], sortCol=-1, sortAsc=true, dragSrc=null, dragMoved=false;
function cp(b,t){navigator.clipboard.writeText(t).then(()=>{b.textContent='✅';setTimeout(()=>b.textContent='📋',1200)})}
function flt(){const q=document.getElementById('q').value.toLowerCase(),c=document.getElementById('fcat').value,s=document.getElementById('fstat').value;let n=0;
document.querySelectorAll('#t tbody tr').forEach(tr=>{const cells=tr.children;const iCat=order.indexOf(0), iStat=order.indexOf(1);
const ok=(!c||cells[iCat].textContent===c)&&(!s||cells[iStat].textContent===s)&&(!q||tr.textContent.toLowerCase().includes(q));tr.style.display=ok?'':'none';if(ok)n++;});
document.getElementById('count').textContent=n+' shops';}
function thIndex(th){return [...th.parentNode.children].indexOf(th)}
function bindTh(){document.querySelectorAll('#t th').forEach(th=>{
 th.onclick=()=>{ if(dragMoved){dragMoved=false;return} srt(thIndex(th),th); };
 th.ondragstart=e=>{dragSrc=thIndex(th);};
 th.ondragover=e=>{e.preventDefault(); th.classList.add('dragover');};
 th.ondragleave=()=>th.classList.remove('dragover');
 th.ondrop=e=>{e.preventDefault(); th.classList.remove('dragover'); const to=thIndex(th); if(dragSrc===null||to===dragSrc)return; moveCol(dragSrc,to); dragSrc=null; dragMoved=true; saveLast();};});}
function moveCol(from,to){document.querySelectorAll('#t tr').forEach(tr=>{const cells=tr.children; const cell=cells[from];
 if(to<from) tr.insertBefore(cell,cells[to]); else tr.insertBefore(cell,cells[to].nextSibling);});
 const v=order.splice(from,1)[0]; order.splice(to,0,v);}
function applyOrder(target){for(let pos=0;pos<target.length;pos++){const cur=order.indexOf(target[pos]); if(cur!==pos) moveCol(cur,pos);}}
function srt(i,thEl){const tb=document.querySelector('#t tbody');const rows=[...tb.rows];
 if(sortCol===i){sortAsc=!sortAsc}else{sortCol=i;sortAsc=true}
 document.querySelectorAll('.arr').forEach(a=>a.textContent='');
 if(thEl) thEl.querySelector('.arr').textContent=sortAsc?'▲':'▼';
 rows.sort((a,b)=>{const x=a.cells[i],y=b.cells[i];
  const nx=x&&x.dataset.n!==undefined?parseFloat(x.dataset.n):NaN, ny=y&&y.dataset.n!==undefined?parseFloat(y.dataset.n):NaN;
  let r; if(!isNaN(nx)&&!isNaN(ny)) r=nx-ny; else r=x.textContent.trim().localeCompare(y.textContent.trim(),'fr');
  return sortAsc?r:-r;});
 rows.forEach(r=>tb.appendChild(r)); saveLast();}
function state(){return {order:[...order], q:document.getElementById('q').value, fcat:document.getElementById('fcat').value, fstat:document.getElementById('fstat').value};}
function applyState(s){ if(!s)return; if(s.order&&s.order.length===NCOL) applyOrder(s.order);
 document.getElementById('q').value=s.q||''; document.getElementById('fcat').value=s.fcat||''; document.getElementById('fstat').value=s.fstat||''; flt();}
function saveLast(){localStorage.setItem('dashLast', JSON.stringify(state()));}
function views(){return JSON.parse(localStorage.getItem('dashViews')||'{}')}
function refreshViews(sel){const v=views(); const el=document.getElementById('views'); el.innerHTML='<option value=\"\">📂 Vues…</option>'+Object.keys(v).map(n=>`<option ${n===sel?'selected':''}>${n}</option>`).join('');}
function saveView(){const n=prompt('Nom de la vue :'); if(!n)return; const v=views(); v[n]=state(); localStorage.setItem('dashViews',JSON.stringify(v)); refreshViews(n);}
function loadView(n){if(!n)return; applyState(views()[n]); saveLast();}
function delView(){const el=document.getElementById('views'); const n=el.value; if(!n)return; const v=views(); delete v[n]; localStorage.setItem('dashViews',JSON.stringify(v)); refreshViews('');}
function resetView(){applyOrder([...Array(NCOL).keys()]); document.getElementById('q').value='';document.getElementById('fcat').value='';document.getElementById('fstat').value='';flt();saveLast();}
const tw=document.getElementById('tw'), ts=document.getElementById('topscroll');
function syncW(){document.getElementById('topscroll-inner').style.width=document.getElementById('t').scrollWidth+'px'}
syncW(); window.addEventListener('resize',syncW);
ts.addEventListener('scroll',()=>{tw.scrollLeft=ts.scrollLeft});
tw.addEventListener('scroll',()=>{ts.scrollLeft=tw.scrollLeft});
bindTh(); refreshViews(''); applyState(JSON.parse(localStorage.getItem('dashLast')||'null')); flt();
</script>""")
content="".join(body)
style="""<style>body{font-family:system-ui,sans-serif;background:#f4f6f4;color:#1d2b1f;margin:0;padding:18px}.wrap{max-width:1600px;margin:0 auto}h1{font-size:1.4rem}.meta{color:#555;font-size:.9rem}.filters{display:flex;gap:8px;align-items:center;margin:16px 0;flex-wrap:wrap}.filters input{flex:1;min-width:180px;padding:9px;border:1px solid #bcc;border-radius:8px}.filters select{padding:9px;border:1px solid #bcc;border-radius:8px;max-width:230px}.btn{padding:8px 10px;border:1px solid #2f6b3a;background:#fff;color:#2f6b3a;border-radius:8px;cursor:pointer}#count{font-weight:700;color:#2f6b3a}#topscroll{overflow-x:auto;height:14px;background:#e7ece7;border-radius:8px 8px 0 0}#topscroll-inner{height:1px}.tablewrap{overflow-x:auto;background:#fff;border-radius:0 0 8px 8px;box-shadow:0 1px 4px rgba(0,0,0,.08)}table{border-collapse:collapse;min-width:1800px;font-size:.82rem;width:100%}th,td{border:1px solid #e2e8e2;padding:5px 7px;text-align:left;vertical-align:top}th{background:#2f6b3a;color:#fff;position:sticky;top:0;white-space:nowrap;cursor:grab;user-select:none}th.dragover{background:#56a060}.arr{font-size:.7rem}tr:nth-child(even){background:#f4f8f4}code{background:#eef3ee;padding:1px 4px;border-radius:4px;font-size:.78rem}.cred{white-space:nowrap}.cp{border:none;background:none;cursor:pointer;font-size:.85rem}a{color:#2f6b3a}footer{margin-top:24px;color:#777;font-size:.85rem}</style>"""
plain=(style+content).encode()
salt=os.urandom(16);nonce=os.urandom(12)
key=PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=salt,iterations=310000).derive(a.password.encode())
ct=AESGCM(key).encrypt(nonce,plain,None)
b64=lambda b:base64.b64encode(b).decode()
payload=json.dumps({"salt":b64(salt),"nonce":b64(nonce),"ct":b64(ct)})
gate="""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow, noarchive"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dashboard privé</title>
<style>body{font-family:system-ui,sans-serif;background:#1d2b1f;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#fff}#gate{background:#27392a;padding:36px;border-radius:12px;text-align:center;max-width:340px}input[type=password]{padding:10px;width:100%;border-radius:6px;border:none;margin:12px 0;box-sizing:border-box}button{padding:10px 24px;border:none;border-radius:6px;background:#5cb85c;color:#fff;font-weight:700;cursor:pointer}#err{color:#ff8a8a;font-size:.85rem;min-height:1em}label{font-size:.9rem;display:block;margin:8px 0}</style></head>
<body><div id="gate"><h2>🔒 Accès privé</h2><p>Entre le mot de passe</p><input type="password" id="pw" autofocus><label><input type="checkbox" id="keep" checked> Rester connecté sur cet appareil</label><button onclick="go()">Entrer</button><p id="err"></p></div>
<script>const P = PAYLOAD_JSON;
const b = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function dec(pw){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b(P.salt),iterations:310000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b(P.nonce)},key,b(P.ct));
document.open();document.write('<meta name="robots" content="noindex, nofollow"><meta charset="utf-8">'+new TextDecoder().decode(pt));document.close();}
async function go(){const pw=document.getElementById('pw').value;
try{await dec(pw); if(document.getElementById('keep')?.checked!==false) localStorage.setItem('dashpw',pw);}catch(e){const er=document.getElementById('err'); if(er) er.textContent='Mot de passe incorrect';}}
const saved=localStorage.getItem('dashpw'); if(saved){dec(saved).catch(()=>{localStorage.removeItem('dashpw')});}
document.getElementById('pw').addEventListener('keydown',e=>{if(e.key==='Enter')go()});
</script></body></html>"""
open(a.out,"w").write(gate.replace("PAYLOAD_JSON",payload))
print("OK ->",a.out)
