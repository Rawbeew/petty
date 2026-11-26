#!/usr/bin/env python3
"""Petty Radar — server-side recall ingestion via Firecrawl.

Pulls PUBLIC recall/alert portals that have no keyless JSON/RSS API through the
Firecrawl scrape endpoint and writes public/recall-cache.json, which the web app
loads same-origin at runtime.

HONESTY CONTRACT:
  * Requires FIRECRAWL_API_KEY (env). Without it, exits 1 and writes nothing.
  * Entries are VERBATIM markdown of the portal page plus provenance
    (url, fetched_at, source id). No summarising, no inventing of recalls.
  * Sources already served by keyless JSON/RSS wires (openFDA, CPSC, FSA,
    ECCC, NWS, police.uk, NYPD, WHO) are deliberately NOT scraped.
  * Respects ToS/robots by construction: we only scrape the exact public pages
    listed below; never WAF/aerogel evasion, never licensed corpora (CanLII,
    AustLII), never paywalled pages.
  * If a source fails, it is recorded as {"status": "unreachable"} — the UI shows
    "scraped cache · unreachable", never stale or invented content.
Run:  FIRECRAWL_API_KEY=fc-... python3 scripts/ingest_recalls.py
"""
import json, os, re, sys, datetime, urllib.request, urllib.error

FIRECRAWL = 'https://api.firecrawl.dev/v1/scrape'
KEY = os.environ.get('FIRECRAWL_API_KEY', '').strip()

# Public recall/alert portals with no machine-readable keyless feed (2026-11-26 audit).
SOURCES = [
    dict(id='fsis-recalls',        market='US', name='USDA FSIS — recalls & public health alerts',
         url='https://www.fsis.usda.gov/recalls'),
    dict(id='tga-recalls',         market='AU', name='TGA — safety alerts & recalls',
         url='https://www.tga.gov.au/safety/alerts-and-recalls'),
    dict(id='anvisa-recalls',      market='BR', name='Anvisa — recalls (recolhimento de produtos)',
         url='https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/recolhimento-de-produtos'),
    dict(id='safetygate-portal',   market='EU', name='EU Safety Gate (RAPEX) — weekly reports',
         url='https://ec.europa.eu/safety-gate-alerts/screen/webReport'),
    dict(id='cfia-recalls',        market='CA', name='CFIA & Health Canada — recalls',
         url='https://recalls-rappels.canada.ca/en/'),
    dict(id='ftda-recalls-uk',     market='GB', name='MHRA — drug & device alerts (fallback for atom-no-CORS)',
         url='https://www.gov.uk/drug-device-alerts'),
]

def scrape(url: str) -> dict:
    body = json.dumps({'url': url, 'formats': ['markdown'], 'onlyMainContent': True,
                       'timeout': 30000}).encode()
    req = urllib.request.Request(FIRECRAWL, data=body, method='POST',
        headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=75) as r:
        return json.loads(r.read().decode())

def main() -> int:
    if not KEY:
        print('FIRECRAWL_API_KEY not set — refusing to write a cache. No data was fabricated.', file=sys.stderr)
        return 1
    out = {'schema': 'petty.recall-cache/v1', 'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
           'engine': 'firecrawl /v1/scrape', 'entries': []}
    for src in SOURCES:
        entry = dict(src, fetched_at=None, status='unreachable', markdown=None, error=None)
        try:
            res = scrape(src['url'])
            md = ((res.get('data') or {}).get('markdown') or '').strip()
            if res.get('success') and md:
                # scrub emails/phones defensively — verbatim product data stays verbatim
                entry.update(status='ok', fetched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'))
                entry['markdown'] = md[:200000]
                print(f"ok           {src['id']:22} {len(md):>8} chars")
            else:
                entry['error'] = str(res.get('error') or 'empty payload')[:300]
                print(f"empty        {src['id']:22} {entry['error']}")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            entry['error'] = f'{type(e).__name__}: {e}'[:300]
            print(f"unreachable  {src['id']:22} {entry['error']}")
        out['entries'].append(entry)
    target = os.path.join(os.path.dirname(__file__), '..', 'public', 'recall-cache.json')
    with open(target, 'w') as f:
        json.dump(out, f, indent=1)
    ok = sum(1 for e in out['entries'] if e['status'] == 'ok')
    print(f'\nwrote public/recall-cache.json — {ok}/{len(out["entries"])} sources ok')
    return 0

if __name__ == '__main__':
    sys.exit(main())
