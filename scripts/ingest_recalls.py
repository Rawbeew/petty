#!/usr/bin/env python3
"""Petty — server-side recall ingestion via Firecrawl.

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

BASE = os.environ.get('FIRECRAWL_API_URL', 'https://api.firecrawl.dev').rstrip('/')
FIRECRAWL = f'{BASE}/v1/scrape'
KEY = os.environ.get('FIRECRAWL_API_KEY', '').strip()
SELF_HOSTED = BASE not in ('https://api.firecrawl.dev', 'https://firecrawl.dev')
MIN_MARKDOWN_CHARS = 400          # shorter than this is a dead/JS-failing page, not a portal
MAX_MARKDOWN_CHARS = 200_000      # verbatim but bounded — cache is a snapshot, not a mirror
SUSPECT_MARKERS = ('access denied', 'captcha', 'you have been blocked', 'attention required',
                   'enable javascript', 'are you a robot')  # heuristics, flagged not deleted

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

def scrape(url: str) -> tuple[int, dict]:
    body = json.dumps({'url': url, 'formats': ['markdown'], 'onlyMainContent': True,
                       'timeout': 30000}).encode()
    headers = {'Content-Type': 'application/json'}
    if KEY:
        headers['Authorization'] = f'Bearer {KEY}'
    req = urllib.request.Request(FIRECRAWL, data=body, method='POST', headers=headers)
    with urllib.request.urlopen(req, timeout=75) as r:
        return r.status, json.loads(r.read().decode())

def main() -> int:
    if not KEY and not SELF_HOSTED:
        print('Set FIRECRAWL_API_KEY (cloud) or FIRECRAWL_API_URL (self-hosted, e.g. http://localhost:3002). No cache written.', file=sys.stderr)
        return 1
    out = {'schema': 'petty.recall-cache/v1', 'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
           'engine': f'firecrawl /v1/scrape @ {BASE}', 'entries': []}
    for src in SOURCES:
        entry = dict(src, fetched_at=None, status='unreachable', markdown=None, error=None)
        try:
            http_status, res = scrape(src['url'])
            md = ((res.get('data') or {}).get('markdown') or '').strip()
            low = md.lower()
            suspect = next((m for m in SUSPECT_MARKERS if m in low), None)
            if http_status == 200 and res.get('success') is not False and len(md) >= MIN_MARKDOWN_CHARS and suspect is None:
                entry.update(status='ok', fetched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'))
                entry['markdown'] = md[:MAX_MARKDOWN_CHARS]
                flag = ' TRUNCATED' if len(md) > MAX_MARKDOWN_CHARS else ''
                print(f"ok           {src['id']:22} {len(md):>8} chars{flag}")
            elif suspect is not None:
                entry['error'] = f'suspect content ({suspect!r}) — likely bot-walled page, not portal data'[:300]
                print(f"suspect      {src['id']:22} {entry['error']}")
            else:
                entry['error'] = f'http {http_status} · {str(res.get("error") or "short/empty markdown")}'[:300]
                print(f"empty        {src['id']:22} {entry['error']}")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            entry['error'] = f'{type(e).__name__}: {e}'[:300]
            print(f"unreachable  {src['id']:22} {entry['error']}")
        out['entries'].append(entry)
    ok = sum(1 for e in out['entries'] if e['status'] == 'ok')
    target = os.path.join(os.path.dirname(__file__), '..', 'public', 'recall-cache.json')
    if ok == 0:
        # Never overwrite a previously good cache with an all-failure one.
        if os.path.exists(target):
            print('all sources failed — keeping previous recall-cache.json untouched', file=sys.stderr)
            return 2
        print('all sources failed — no cache written', file=sys.stderr)
        return 2
    prev_entries = len(out['entries'])
    tmp = target + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(out, f, indent=1)
    os.replace(tmp, target)  # atomic — readers never see a half-written cache
    print(f'\nwrote public/recall-cache.json — {ok}/{prev_entries} sources ok')
    return 0

if __name__ == '__main__':
    sys.exit(main())
