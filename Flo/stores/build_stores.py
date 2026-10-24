#!/usr/bin/env python3
"""Build ../stores.csv from the raw official downloads in ../raw/.

    python3 -I scripts/build_stores.py

Sources (one per province/territory, see SOURCES below). Only stores that the
source marks as authorized/licensed/open are kept. Coordinates are copied only
when the source itself publishes them (no geocoding).
"""
import csv
import datetime as dt
import json
import os
import re
import sys
import warnings
from collections import Counter

import pandas as pd
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore")
BASE = os.path.dirname(os.path.abspath(__file__))  # Flo/stores/
RAW = os.path.join(BASE, "raw")
OUT = os.path.join(BASE, "stores.csv")
HEADER = ["province_code", "city", "name", "address", "postal_code", "phone", "website",
          "lat", "lon", "source", "source_url", "retrieved_at"]

URL = {
    "ON": "https://www.agco.ca/sites/default/files/opendata/AGCOWebSiteCRSANewProcessMapData.csv",
    "AB": "https://aglc.ca/cannabis/retail-cannabis/cannabis-licensee-search",
    "BC": ("https://www2.gov.bc.ca/assets/gov/employment-business-and-economic-development/"
           "business-management/liquor-regulation-licensing/reports/cannabis_retail_stores_in_bc.xlsx"),
    "BC_MAP": "https://justice.gov.bc.ca/lcrb/map",
    "MB": "https://lgcamb.ca/cannabis/store-list/",
    "SK": ("https://www.slga.com/cannabis/cannabis-permits/"
           "authorized-saskatchewan-cannabis-sellers-and-distributors"),
    "QC": ("https://www.sqdc.ca/media/476bc357-4dbe-4695-9663-f820ac0b2cee/KflYRQ/Olive/"
           "Acc%C3%A8s%20info/Diffusion%20de%20l'information/Liste%20des%20Baux%202023-2024.pdf"),
    "NL": "https://shopcannabisnl.com/apps/store-locator",
    "PE": "https://peicannabiscorp.com/contact/",
    "NT": "https://www.ntlcc.ca/en/cannabis/where-buy-cannabis",
    "YT": "https://yukon.ca/en/your-government/find-out-what-government-doing/learn-about-cannabis",
}

# Canada-wide bounding boxes per province (rough) to sanity-check coordinates.
BBOX = {"ON": (41.6, 57.0, -95.2, -74.3), "BC": (48.2, 60.1, -139.1, -114.0),
        "NL": (46.6, 60.5, -67.9, -52.5)}

# ---------------------------------------------------------------- helpers
SMALL = {"on", "the", "of", "de", "du", "des", "la", "le", "les", "sur", "and", "en", "aux", "au"}


def clean(s):
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    s = str(s).replace("\xa0", " ").replace("​", "")
    return re.sub(r"\s+", " ", s).strip()


def smart_title(s):
    s = clean(s)
    if not s or s != s.upper():  # keep the source casing unless it is ALL CAPS
        return s
    out = re.sub(r"[A-Za-zÀ-ÿ]+", lambda m: m.group(0).capitalize(), s.lower())
    out = re.sub(r"'S\b", "'s", out)
    out = re.sub(r"\bMc([a-z])", lambda m: "Mc" + m.group(1).upper(), out)
    parts = re.split(r"(\s+|-)", out)
    words = [i for i, p in enumerate(parts) if p.strip() and p != "-"]
    for i in words[1:]:
        if parts[i].lower() in SMALL:
            parts[i] = parts[i].lower()
    return "".join(parts)


def clean_city(s):
    s = clean(s)
    s = re.sub(r"(?:,\s*|\s+\()(?:ON|AB|BC|MB|SK|QC|NB|NS|PE|NL|YT|NT|NU|Québec|Quebec|Ontario|Yukon)\)?\.?$",
               "", s).strip(" ,")
    s = smart_title(s.title() if s == s.lower() else s)
    # light harmonisation of spelling variants of the same municipality name
    s = re.sub(r"\bSt\b(?![.\-'])", "St.", s)
    s = re.sub(r"\bSte\b(?![.\-'])", "Ste.", s)
    s = re.sub(r"-(De|Du|Des|La|Le|Les|Sur|En|Aux|Au)-", lambda m: "-" + m.group(1).lower() + "-", s)
    s = CITY_FIX.get(s, s)
    return s


CITY_FIX = {"Northyork": "North York", "St. Mary's": "St. Marys", "Lasalle": "LaSalle",
            "Ridgeway, Fort Erie": "Ridgeway", "Tsuut'Ina": "Tsuut'ina"}


def norm_postal(s):
    s = clean(s).upper().replace(" ", "")
    if len(s) == 8 and s[:2] in {"NL", "NS", "NB", "PE", "QC", "ON", "MB", "SK", "AB", "BC", "YT", "NT", "NU"}:
        s = s[2:]  # e.g. "NLA1M2M4"
    if len(s) == 6:  # letter O / I typed instead of digit 0 / 1 in digit positions
        s = "".join({"O": "0", "I": "1"}.get(c, c) if i in (1, 3, 5) else c for i, c in enumerate(s))
    if re.fullmatch(r"[A-Z]\d[A-Z]\d[A-Z]\d", s):
        return f"{s[:3]} {s[3:]}"
    return clean(s)


def norm_phone(s):
    s = clean(s)
    if not s:
        return ""
    m = re.search(r"(?:ext\.?|x)\s*(\d+)", s, re.I)
    ext = m.group(1) if m else None
    main = s[:m.start()] if m else s
    main = re.sub(r"\([^)]*[A-Za-z][^)]*\)", "", main)  # e.g. "(4THC)"
    d = re.sub(r"\D", "", main)
    if len(d) == 11 and d.startswith("1"):
        d = d[1:]
    if len(d) == 10:
        out = f"{d[:3]}-{d[3:6]}-{d[6:]}"
        return f"{out} ext {ext}" if ext else out
    return "" if len(d) < 10 else s  # drop incomplete numbers such as "604"


def norm_web(s):
    s = clean(s)
    if s.lower() in {"", "n/a", "na", "none", "-", "tbd"}:
        return ""
    if not re.match(r"^https?://", s, re.I) and "." in s:
        s = "https://" + s
    return s


def coord(v, prov, axis):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return ""
    if prov in BBOX:
        lo, hi = (BBOX[prov][0], BBOX[prov][1]) if axis == "lat" else (BBOX[prov][2], BBOX[prov][3])
        if not (lo <= f <= hi):
            return ""
    return f"{f:.6f}".rstrip("0").rstrip(".")


def day_of(path):
    return dt.date.fromtimestamp(os.path.getmtime(path)).isoformat()


def rec(prov, city, name, address, postal="", phone="", website="", lat="", lon="",
        source="", source_url="", retrieved_at=""):
    q = lambda v: clean(v).replace("’", "'").replace("`", "'")
    return {"province_code": prov, "city": clean_city(q(city)), "name": q(name),
            "address": q(address).strip(" ,"), "postal_code": norm_postal(postal),
            "phone": norm_phone(phone), "website": norm_web(website), "lat": lat, "lon": lon,
            "source": source, "source_url": source_url, "retrieved_at": retrieved_at}


# ---------------------------------------------------------------- provinces
def ontario():
    p = os.path.join(RAW, "on", "AGCOWebSiteCRSANewProcessMapData.csv")
    d = pd.read_csv(p, dtype=str, encoding="utf-8-sig").fillna("")
    d = d[d.ApplicationStatusEn.str.strip() == "Authorized to Open"]
    d = d[d.LicenceStatus.isin(["Active", "Expired - Deemed to Continue"])]
    d = d.drop_duplicates("LicenceNumber")
    day = day_of(p)
    return [rec("ON", r.City, r.PremisesName, r.StreetAddress, r.PostalCode, "", r.WebsiteEn,
                coord(r.Latitude, "ON", "lat"), coord(r.Longitude, "ON", "lon"),
                "AGCO", URL["ON"], day) for r in d.itertuples()]


def alberta():
    p = os.path.join(RAW, "ab", "aglc_cannabis_licensee_report_opt1.xls")
    d = pd.read_excel(p, dtype=str).fillna("")
    d.columns = [c.strip() for c in d.columns]
    d = d[d["Site Province Abbrev"].str.strip() == "AB"]  # retailer filter already applied
    day = day_of(p)
    out = []
    for r in d.to_dict("records"):
        addr = clean(r["Site Address Line 1"])
        if clean(r["Site Address Line 2"]):
            addr += ", " + clean(r["Site Address Line 2"])
        out.append(rec("AB", r["Site City Name"], r["Establishment Name"], addr,
                       r["Site Postal Code"], r["Telephone Number"], "", "", "",
                       "AGLC", URL["AB"], day))
    return out


def bccs_phones():
    """BC Cannabis Stores (government) page: postal code -> phone."""
    p = os.path.join(RAW, "bc", "bccs_store_locations.html")
    s = BeautifulSoup(open(p, encoding="utf-8").read(), "html.parser")
    res = {}
    for info in s.select("div.page--store-locations--store-info"):
        ph = info.select_one("a.store-phone")
        txt = info.get_text(" ", strip=True)
        m = re.search(r"\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b", txt)
        if ph and m:
            res[m.group(1) + m.group(2)] = clean(ph.get_text())
    return res


def british_columbia():
    p = os.path.join(RAW, "bc", "cannabis_retail_stores_in_bc.xlsx")
    d = pd.read_excel(p, sheet_name=0, dtype=str).fillna("")
    open_col = [c for c in d.columns if c.startswith("Open?")][0]
    d = d[d[open_col].str.strip() == "Yes"]
    m = json.load(open(os.path.join(RAW, "bc", "lcrb_establishments_map_api.json")))
    bymap = {str(x["license"]): x for x in m if x.get("isOpen")}
    phones = bccs_phones()
    day = day_of(p)
    out, skipped = [], []
    for r in d.to_dict("records"):
        lic = clean(r["Licence Number"])
        if not clean(r["Establishment Address Street"]):
            skipped.append((lic, r["Establishment"]))
            continue
        mp = bymap.get(lic, {})
        phone, src = mp.get("phone") or "", "LCRB"
        if not phone and clean(r["Licensee"]) == "Liquor Distribution Branch":
            phone = phones.get(norm_postal(r["Establishment Address Postal Code"]).replace(" ", ""), "")
            if phone:
                src = "LCRB; BC Cannabis Stores (phone)"
        out.append(rec("BC", r["Establishment Address City"], r["Establishment"],
                       r["Establishment Address Street"], r["Establishment Address Postal Code"],
                       phone, "", coord(mp.get("latitude"), "BC", "lat"),
                       coord(mp.get("longitude"), "BC", "lon"), src, URL["BC"], day))
    if skipped:
        print("  BC skipped (no address in source):", skipped, file=sys.stderr)
    return out


def split_name_addr(t):
    t = clean(t)
    m = re.match(r"^(.*?),\s+(.*)$", t)
    if m:
        return m.group(1), m.group(2)
    m = re.match(r"^(.*?)\s+[-–]\s+(\d.*)$", t)
    if m:
        return m.group(1), m.group(2)
    return t, ""


def manitoba():
    p = os.path.join(RAW, "mb", "lgca_store_list.html")
    s = BeautifulSoup(open(p, encoding="utf-8").read(), "html.parser")
    start = s.find(string=re.compile("LEGAL CANNABIS STORES IN MANITOBA")).find_parent()
    day = day_of(p)
    out, city = [], None
    for el in start.find_all_next(["strong", "li", "p"]):
        txt = clean(el.get_text(" "))
        if el.name == "p" and txt.startswith("Other prospective cannabis retailers"):
            break
        if el.name == "strong":
            city = txt.rstrip(":").strip()
        elif el.name == "li" and city:
            name, addr = split_name_addr(txt)
            out.append(rec("MB", city, name, addr, "", "", "", "", "", "LGCA", URL["MB"], day))
    return out


def saskatchewan():
    fs = sorted(f for f in os.listdir(os.path.join(RAW, "sk")) if f.endswith(".xlsx") and "retailers" in f)
    p = os.path.join(RAW, "sk", fs[-1])
    d = pd.read_excel(p, dtype=str).fillna("")
    d = d[d.StatusDesc.str.strip() == "Active"]
    day = day_of(p)
    out = []
    for r in d.to_dict("records"):
        city, name = clean(r["City"]), clean(r["Operating Name"])
        name = re.sub(r"\s+-\s+" + re.escape(city) + r"$", "", name, flags=re.I)  # drop " - <City>"
        out.append(rec("SK", city, name, r["Street Address"], "", "", r["Website"], "", "",
                       "SLGA", URL["SK"], day))
    return out


def quebec():
    import pdfplumber
    p = os.path.join(RAW, "qc", "Liste_des_Baux_2023-2024.pdf")
    rows = []
    with pdfplumber.open(p) as pdf:
        for page in pdf.pages:
            for t in page.extract_tables():
                rows += t
    day = day_of(p)
    out = []
    for r in rows:
        if not r or not (r[0] or "").strip().isdigit():
            continue
        name, adr = clean(r[1]), [clean(x) for x in (r[3] or "").split("\n") if clean(x)]
        pc = r"([A-Z]\d[A-Z]\s?\d[A-Z]\d)"
        m = re.match(r"^(.*?)\s*\((?:Québec|Quebec)\)\s*(?:Québec\s*)?" + pc + r"?\s*$", adr[-1])
        m1 = re.match(r"^(.*),\s*Québec\s+" + pc + r"$", adr[-1])
        if len(adr) > 1 and m:                      # "street" / "City (Québec) H1H 1H1"
            street, city, postal = " ".join(adr[:-1]), m.group(1), m.group(2) or ""
        elif len(adr) == 1 and m1:                  # "street, City, Québec H1H 1H1"
            pre, postal = m1.group(1), m1.group(2)
            if pre.endswith(name):
                street, city = pre[: -len(name)], name
            else:
                street, city = pre.rsplit(",", 1)
        else:
            sys.exit(f"QC row not understood: {r}")
        if not city.strip():                        # e.g. Beloeil: "(Québec) Québec J3G 0K1"
            city = name.split(" - ")[0]
            print(f"  QC city missing in source, taken from store name: {name}", file=sys.stderr)
        out.append(rec("QC", city, "SQDC - " + name, street.strip(" ,"), postal, "", "https://www.sqdc.ca",
                       "", "", "SQDC (lease list 2024-03-30)", URL["QC"], day))
    return out


def newfoundland():
    p = os.path.join(RAW, "nl", "nl_stores_surrounding.json")
    st = json.load(open(p, encoding="utf-8"))["stores"]
    day = day_of(p)
    out = []
    for x in st:
        addr = clean(x.get("address"))
        if clean(x.get("address2")):
            addr += ", " + clean(x["address2"])
        out.append(rec("NL", x.get("city"), x.get("name"), addr, x.get("postal_zip"), x.get("phone"),
                       x.get("website"), coord(x.get("lat"), "NL", "lat"), coord(x.get("lng"), "NL", "lon"),
                       "NLC (CannabisNL store locator)", URL["NL"], day))
    return out


def pei():
    p = os.path.join(RAW, "pe", "contact.html")
    s = BeautifulSoup(open(p, encoding="utf-8").read(), "html.parser")
    t = s.get_text("\n", strip=True)
    t = t[t.find("Our Locations"):]
    day = day_of(p)
    out = []
    pat = re.compile(r"\n([^\n]+)\n([^\n]+?),?\n([^\n,]+), PE ([A-Z]\d[A-Z] ?\d[A-Z]\d)\nPhone:\n([\d\- ()]+)")
    for m in pat.finditer(t):
        label, street, city, postal, phone = m.groups()
        street = re.sub(r",?\s*PO Box \d+", "", street).strip(" ,")
        out.append(rec("PE", city.replace("’", "'"), "PEI Cannabis - " + label.replace("’", "'"),
                       street, postal, phone, "https://peicannabiscorp.com", "", "", "PEI Cannabis",
                       URL["PE"], day))
    return out


NT_STORES = [  # transcribed from raw/nt/ntlcc_where_buy_cannabis.html (checked below)
    ("Fort Smith", "Abraham's Cannabis", "23 Portage Avenue", "780-285-9252"),
    ("Fort Simpson", "Abraham's Cannabis", "9410-100 Street", "867-332-3305"),
    ("Hay River", "It's 4:20 Somewhere", "1-4 Courtoreille Street", "(867) 876-0111"),
    ("Inuvik", "Abraham's Cannabis", "110 Veteran’s Way", "867-620-0314"),
    ("Norman Wells", "Sahtu Spot", "5 Town Square", "(587) 590-7634"),
    ("Yellowknife", "Releaf NT", "5123 51 St", ""),
    ("Yellowknife", "Trailblazer Cannabis Shop", "Unit 12, 100 Borden Drive", "(867) 766-4838"),
]


def nwt():
    p = os.path.join(RAW, "nt", "ntlcc_where_buy_cannabis.html")
    t = BeautifulSoup(open(p, encoding="utf-8").read(), "html.parser").get_text("\n", strip=True)
    day = day_of(p)
    out = []
    for city, name, addr, phone in NT_STORES:
        for frag in (addr, phone):
            if frag and frag not in t:
                sys.exit(f"NT source changed: '{frag}' not found; update NT_STORES")
        out.append(rec("NT", city, name, addr.replace("’", "'"), "", phone, "", "", "", "NTLCC", URL["NT"], day))
    n_listed = len(re.findall(r"Hours:", t))
    if n_listed != len(NT_STORES):
        print(f"  WARNING NT page lists {n_listed} 'Hours:' blocks vs {len(NT_STORES)} transcribed", file=sys.stderr)
    return out


def yukon():
    p = os.path.join(RAW, "yt", "yukon_retailers_transcribed.json")
    j = json.load(open(p, encoding="utf-8"))
    return [rec("YT", x["city"], x["name"], x["address"], x["postal_code"], x["phone"], x["website"],
                "", "", "Yukon.ca (Yukon Liquor Corp. list)", j["source_url"], "2026-10-24")
            for x in j["stores"]]


def dedupe(rows):
    seen, out, dropped = set(), [], []
    for r in rows:
        k = (r["province_code"], re.sub(r"[^a-z0-9]", "", r["address"].lower()),
             re.sub(r"[^a-z0-9]", "", (r["postal_code"] or r["city"]).lower()))
        if k in seen and r["address"]:
            dropped.append(r)
            continue
        seen.add(k)
        out.append(r)
    return out, dropped


def main():
    rows = []
    for fn in (ontario, alberta, british_columbia, manitoba, saskatchewan, quebec,
               newfoundland, pei, nwt, yukon):
        got = fn()
        print(f"{fn.__name__:18s} {len(got)}", file=sys.stderr)
        rows += got
    rows, dropped = dedupe(rows)
    for r in dropped:
        print("  duplicate dropped:", r["province_code"], r["name"], r["address"], file=sys.stderr)
    rows.sort(key=lambda r: (r["province_code"], r["city"].lower(), r["name"].lower(), r["address"].lower()))
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {OUT}: {len(rows)} stores", file=sys.stderr)
    c = Counter(r["province_code"] for r in rows)
    print(dict(sorted(c.items())), file=sys.stderr)


if __name__ == "__main__":
    main()
