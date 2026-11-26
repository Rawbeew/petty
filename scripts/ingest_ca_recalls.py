#!/usr/bin/env python3
"""Petty — Canada recall snapshot builder (weekly CI; also runnable locally).

Source: Health Canada / CFIA / TC — "Recalls and Safety Alerts" open data
  (Open Government Licence – Canada). Full file is ~16 MB / 34k rows; we keep the
  80 most recent NON-ARCHIVED rows, verbatim, plus provenance. Output is a static
  snapshot consumed by the app; it is NOT live — the UI shows the generatedAt stamp.
"""
import json, re, sys, urllib.request, unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'ca-recalls.json'
SRC = 'https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json'
KEEP = 80

def norm(s: str) -> str:
    # normalize unicode junk (zero-width spaces ship in the source); never rewrites meaning
    s = unicodedata.normalize('NFKC', s or '')
    return re.sub(r'[\u200b\u200c\u200d\ufeff]', '', s).strip()

def main():
    print('fetching', SRC)
    req = urllib.request.Request(SRC, headers={'User-Agent': 'petty-ca-snapshot/1.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        rows = json.loads(r.read().decode())
    print('rows:', len(rows))
    fresh = [r for r in rows if norm(str(r.get('Archived', '0'))) not in ('1', 'true', 'yes')]
    key = lambda r: norm(str(r.get('Last updated') or ''))
    # 2,717 source rows carry a null Last updated — they are unusable for a recency feed, so exclude (not fabricate a date)
    fresh = [r for r in fresh if re.fullmatch(r'\d{4}-\d{2}-\d{2}', key(r))]
    fresh.sort(key=key, reverse=True)
    keep = fresh[:KEEP]
    if len(keep) < 20:
        print('FAIL: suspiciously few rows after filter — refusing to write'); sys.exit(1)
    out = {
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'Health Canada / CFIA / Transport Canada — Recalls and Safety Alerts (open data)',
        'sourceUrl': 'https://recalls-rappels.canada.ca/',
        'datasetUrl': SRC,
        'license': 'Open Government Licence – Canada',
        'attribution': 'Health Canada (recalls-rappels.canada.ca), used under the Open Government Licence – Canada',
        'note': 'Weekly static snapshot — not live. Titles verbatim (unicode-normalized). Verify every recall at its URL before acting.',
        'count': len(keep),
        'recalls': [
            {'nid': norm(str(r.get('NID', ''))),
             'title': norm(str(r.get('Title', ''))),
             'organization': norm(str(r.get('Organization', ''))),
             'issue': norm(str(r.get('Issue', ''))),
             'recallClass': norm(str(r.get('Recall class', ''))),
             'updated': key(r),
             'url': norm(str(r.get('URL', '')))}
            for r in keep
        ],
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print('wrote', OUT, len(keep), 'recalls, newest updated', key(keep[0]))

if __name__ == '__main__':
    main()
