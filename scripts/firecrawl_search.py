#!/usr/bin/env python3
"""Petty Radar — Firecrawl search CLI for ANALYST DISCOVERY ONLY.

Search results are DISCOVERY, never enforcement evidence and never rendered by the app
as agency truth. Outputs URLs + snippets for human triage into the audit log.
Usage: FIRECRAWL_API_KEY=fc-... python3 scripts/firecrawl_search.py "query" [limit]
"""
import json, os, sys, urllib.request

KEY = os.environ.get('FIRECRAWL_API_KEY', '').strip()
if not KEY:
    sys.exit('FIRECRAWL_API_KEY not set — no search performed.')
query = sys.argv[1] if len(sys.argv) > 1 else sys.exit('usage: firecrawl_search.py "query" [limit]')
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 8

body = json.dumps({'query': query, 'limit': limit}).encode()
req = urllib.request.Request('https://api.firecrawl.dev/v1/search', data=body, method='POST',
    headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=60) as r:
    res = json.loads(r.read().decode())
print(f'DISCOVERY — NOT AGENCY EVIDENCE · query={query!r}\n')
for item in (res.get('data') or []):
    print('*', (item.get('title') or '')[:110])
    print(' ', item.get('url'))
    desc = (item.get('description') or '').replace('\n', ' ')
    if desc: print(' ', desc[:220])
    print()
