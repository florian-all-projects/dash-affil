#!/usr/bin/env python3
"""Download the official cannabis retail store lists into ../raw/<prov>/.

Polite: one request at a time, >=1.5 s between requests to the same host,
10 s for lgcamb.ca (robots.txt Crawl-delay: 10). Run from anywhere:

    python3 -I Flo/stores/fetch_sources.py [--only ON,AB,...]

Hosts that are behind a Cloudflare challenge from a script (sqdc.ca store
locator, mynslc.com, cannabis-nb.com, yukon.ca) are NOT scraped here; see
README notes in build_stores.py.
"""
import argparse
import json
import os
import re
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = os.path.dirname(os.path.abspath(__file__))  # Flo/stores/
RAW = os.path.join(BASE, "raw")
UA = "Mozilla/5.0 (X11; Linux x86_64) research-store-directory"
S = requests.Session()
S.headers["User-Agent"] = UA
_last = {}


def polite_get(url, delay=1.5, **kw):
    host = re.sub(r"^https?://([^/]+).*", r"\1", url)
    wait = _last.get(host, 0) + delay - time.time()
    if wait > 0:
        time.sleep(wait)
    r = S.get(url, timeout=90, **kw)
    _last[host] = time.time()
    r.raise_for_status()
    return r


def polite_post(url, data, delay=1.5):
    host = re.sub(r"^https?://([^/]+).*", r"\1", url)
    wait = _last.get(host, 0) + delay - time.time()
    if wait > 0:
        time.sleep(wait)
    r = S.post(url, data=data, timeout=90)
    _last[host] = time.time()
    r.raise_for_status()
    return r


def save(prov, name, content):
    d = os.path.join(RAW, prov.lower())
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name)
    mode = "wb" if isinstance(content, bytes) else "w"
    with open(p, mode, **({} if mode == "wb" else {"encoding": "utf-8"})) as f:
        f.write(content)
    print(f"  saved {p} ({len(content)} bytes)")
    return p


def fetch_on():
    # AGCO page renders its table client-side from this CSV.
    url = "https://www.agco.ca/sites/default/files/opendata/AGCOWebSiteCRSANewProcessMapData.csv"
    save("on", "AGCOWebSiteCRSANewProcessMapData.csv", polite_get(url).content)


def fetch_ab():
    # AGLC licensee search: POST the Drupal form with "Retailers" filter, then
    # the Excel export returns the session's last search.
    u = "https://aglc.ca/cannabis/retail-cannabis/cannabis-licensee-search"
    r = polite_get(u)
    f = BeautifulSoup(r.text, "html.parser").find("form", id="cannabis-licensee-search-form")
    data = {
        "licensee_name": "", "search_type": "0", "city_select": "all",
        "postal_code": "", "postal_code_range": "0",
        "advanced_options": "1",  # 0=All 1=Retailers 2=Registered representatives
        "op": "Search",
        "form_build_id": f.find("input", attrs={"name": "form_build_id"})["value"],
        "form_id": "cannabis_licensee_search_form",
    }
    r2 = polite_post(u, data)
    save("ab", "aglc_licensee_search_opt1.html", r2.text)
    r3 = polite_get("https://aglc.ca/cannabis/cannabis-licensee-report/EXCEL")
    save("ab", "aglc_cannabis_licensee_report_opt1.xls", r3.content)


def fetch_bc():
    save("bc", "cannabis_retail_stores_in_bc.xlsx", polite_get(
        "https://www2.gov.bc.ca/assets/gov/employment-business-and-economic-development/"
        "business-management/liquor-regulation-licensing/reports/cannabis_retail_stores_in_bc.xlsx").content)
    # LCRB public map (justice.gov.bc.ca/lcrb/map) data, includes lat/lon
    save("bc", "lcrb_establishments_map_api.json", polite_get(
        "https://justice.gov.bc.ca/lcrb/api/establishments/map",
        headers={"Accept": "application/json"}).content)
    save("bc", "bccs_store_locations.html", polite_get(
        "https://www.bccannabisstores.com/pages/store-locations").text)


def fetch_mb():
    save("mb", "lgca_store_list.html", polite_get("https://lgcamb.ca/cannabis/store-list/", delay=10).text)


def fetch_sk():
    page = "https://www.slga.com/cannabis/cannabis-permits/authorized-saskatchewan-cannabis-sellers-and-distributors"
    r = polite_get(page)
    save("sk", "slga_authorized_sellers.html", r.text)
    s = BeautifulSoup(r.text, "html.parser")
    links = [a["href"] for a in s.find_all("a", href=True)
             if "cannabis-retailers" in a["href"] and a["href"].lower().endswith(".xlsx")]
    if not links:
        sys.exit("SLGA retailer xlsx link not found")
    url = urljoin(page, links[0])
    save("sk", os.path.basename(url), polite_get(url).content)


def fetch_qc():
    # SQDC store locator is behind a Cloudflare challenge; the most recent
    # official machine-readable list found is the access-to-information
    # "Liste des baux" (leases as of 2024-03-30).
    url = ("https://www.sqdc.ca/media/476bc357-4dbe-4695-9663-f820ac0b2cee/KflYRQ/Olive/"
           "Acc%C3%A8s%20info/Diffusion%20de%20l'information/Liste%20des%20Baux%202023-2024.pdf")
    save("qc", "Liste_des_Baux_2023-2024.pdf", polite_get(url).content)


def fetch_nl():
    # NLC's CannabisNL site (shopcannabisnl.com) store-locator app proxy.
    url = ("https://shopcannabisnl.com/apps/store-locator/stores/surrounding?"
           "shop=nlc-production.myshopify.com&latitude=48.5&longitude=-56.0"
           "&max_distance=0&limit=0&calc_distance=0")
    save("nl", "nl_stores_surrounding.json", polite_get(url).content)


def fetch_pe():
    save("pe", "contact.html", polite_get("https://peicannabiscorp.com/contact/").text)


def fetch_nt():
    save("nt", "ntlcc_where_buy_cannabis.html",
         polite_get("https://www.ntlcc.ca/en/cannabis/where-buy-cannabis").text)


def fetch_nu():
    save("nu", "nulc_purchasing.html", polite_get("https://nulc.ca/purchasing.aspx").text)


FETCHERS = {"ON": fetch_on, "AB": fetch_ab, "BC": fetch_bc, "MB": fetch_mb, "SK": fetch_sk,
            "QC": fetch_qc, "NL": fetch_nl, "PE": fetch_pe, "NT": fetch_nt, "NU": fetch_nu}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=",".join(FETCHERS))
    a = ap.parse_args()
    for p in a.only.split(","):
        p = p.strip().upper()
        print(p)
        FETCHERS[p]()
    # YT: yukon.ca returns 403 to scripts; raw/yt/yukon_retailers_transcribed.json
    # is a manual transcription of https://yukon.ca/en/your-government/
    # find-out-what-government-doing/learn-about-cannabis (fetched via WebFetch).
