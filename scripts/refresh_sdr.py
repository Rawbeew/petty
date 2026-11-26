#!/usr/bin/env python3
"""Petty — SDR → USD auto-refresh (weekly, via .github/workflows/sdr-refresh.yml).

Sources (cross-checked, both free, no keys):
  primary : https://open.er-api.com/v6/latest/USD      (exchangerate-api.com)
  witness : jsdelivr currency-api (fawazahmed0)         (github.com/fawazahmed0/exchange-api)
IMF reserves remain the primary authority — this keeps the stamp honest between
manual IMF checks; it does not replace them. Aborts WITHOUT touching the repo
if sources disagree by >2% or fall outside sanity bounds.
"""
import json, re, sys, urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATUTES = ROOT / 'src' / 'statutes.ts'
REPORT = ROOT / 'reports' / f'sdr-refresh-{date.today().isoformat()}.md'

def get_json(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': 'petty-sdr-refresh/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def fetch_primary():
    d = get_json('https://open.er-api.com/v6/latest/USD')
    per_usd = d['rates']['XDR']  # XDR per 1 USD
    return 1 / per_usd, d.get('time_last_update_utc', '?')

def fetch_witness():
    d = get_json('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
    per_usd = d['usd']['xdr']
    return 1 / per_usd, d.get('date', '?')

def main():
    try:
        p_rate, p_ts = fetch_primary()
        w_rate, w_ts = fetch_witness()
    except Exception as e:
        REPORT.write_text(f'# SDR refresh — {date.today()} — FAILED\n\nFetch error: {e}\n\nRepo NOT modified.\n')
        print(f'FAIL: {e}'); return 0

    spread = abs(p_rate - w_rate) / p_rate
    REPORT.write_text(
        f'# SDR refresh — {date.today().isoformat()}\n\n'
        f'- Primary (exchangerate-api.com): 1 SDR = ${p_rate:.4f} USD  (updated {p_ts})\n'
        f'- Witness (jsdelivr currency-api): 1 SDR = ${w_rate:.4f} USD  (date {w_ts})\n'
        f'- Spread: {spread:.2%}\n')
    if spread > 0.02 or not (1.0 <= p_rate <= 2.0):
        REPORT.write_text(REPORT.read_text() + '\n**ABORT — sources disagree or out of bounds. Repo NOT modified.**\n')
        print(f'ABORT spread={spread:.2%} p={p_rate}'); return 0

    src = STATUTES.read_text()
    m = re.search(r"export const SDR_TO_USD = ([\d.]+);", src)
    if not m:
        print('FAIL: SDR_TO_USD constant not found'); return 0
    current = float(m.group(1))
    if abs(p_rate - current) < 0.005:
        print(f'no change needed (current {current}, primary {p_rate:.4f})'); return 0

    implied_change = f'{current} -> {p_rate:.2f}'
    src = src.replace(f"export const SDR_TO_USD = {current};", f"export const SDR_TO_USD = {p_rate:.4f};")
    src = re.sub(r"export const SDR_VERIFIED_AT = '[^']+';",
                 f"export const SDR_VERIFIED_AT = '{date.today().isoformat()}';", src)
    STATUTES.write_text(src)
    REPORT.write_text(REPORT.read_text() + f'\n**UPDATED** SDR_TO_USD {implied_change}; SDR_VERIFIED_AT → {date.today().isoformat()}\n')
    print(f'UPDATED {implied_change}'); return 0

if __name__ == '__main__':
    sys.exit(main())
