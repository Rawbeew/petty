#!/usr/bin/env python3
"""Petty — registry link audit. Re-runnable; not part of the merge gate.

Fetches every URL in the regulator registry + claim targets with a browser UA,
classifies the result, and writes reports/link-audit-<today>.md.
Exit 0 always (audit, not gate). Run: python3 scripts/verify_links.py"""
import subprocess, sys, pathlib, datetime

URLS = [
  # US
  ('US', 'openFDA — enforcement reports', 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts'),
  ('US', 'CPSC — recalls (page)', 'https://www.cpsc.gov/Recalls'),
  ('US', 'CPSC — recalls API (wired)', 'https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2026-10-01&RecallDateEnd=2026-11-26'),
  ('US', 'USDA FSIS — recalls', 'https://www.fsis.usda.gov/recalls'),
  ('US', 'NWS — API docs', 'https://www.weather.gov/documentation/services-web-api'),
  ('US', 'NWS — alerts API (wired)', 'https://api.weather.gov/alerts/active?status=actual&message_type=alert'),
  ('US', 'NYPD — dataset page (wired)', 'https://data.cityofnewyork.us/Transportation/Motor-Vehicle-Collisions-Crashes/h9gi-nx95'),
  ('US', 'NYPD — SODA API (wired)', 'https://data.cityofnewyork.us/resource/h9gi-nx95.json?$select=count(*)&$where=crash_date%3E=%272026-11-19%27'),
  ('US', 'DC stop data — docs', 'https://dev.socrata.com/foundry/opendata.dc.gov'),
  ('US', 'CourtListener — API help', 'https://www.courtlistener.com/help/api'),
  ('US', 'Broadcastify Calls', 'https://www.broadcastify.com/calls'),
  ('US', 'MissingMoney (NAUPA)', 'https://www.missingmoney.com'),
  ('US', 'Treasury Hunt', 'https://www.treasurydirect.gov/savings-bonds/treasury-hunt/'),
  ('US', 'DOT airconsumer', 'https://www.transportation.gov/airconsumer'),
  # GB
  ('GB', 'FSA — food alerts API (wired)', 'https://data.food.gov.uk/food-alerts/id.json?_limit=1&_sort=-created'),
  ('GB', 'FSA — API reference', 'https://data.food.gov.uk/food-alerts/ui/reference'),
  ('GB', 'MHRA — drug & device alerts', 'https://www.gov.uk/drug-device-alerts'),
  ('GB', 'MHRA — atom feed (no CORS)', 'https://www.gov.uk/drug-device-alerts.atom'),
  ('GB', 'Met Office', 'https://www.metoffice.gov.uk'),
  ('GB', 'police.uk — stops docs', 'https://data.police.uk/docs/method/stops-street/'),
  ('GB', 'police.uk — stops API (wired)', 'https://data.police.uk/api/stops-street?date=2026-09&lat=51.508&lng=-0.128'),
  ('GB', 'police.uk — crimes API (wired)', 'https://data.police.uk/api/crimes-street/all-crime?lat=51.508&lng=-0.128&date=2026-09'),
  ('GB', 'Find Case Law (wired)', 'https://caselaw.nationalarchives.gov.uk/atom.xml'),
  ('GB', 'Find Case Law — portal', 'https://caselaw.nationalarchives.gov.uk'),
  ('GB', 'Bona Vacantia', 'https://www.gov.uk/government/organisations/bona-vacantia'),
  ('GB', 'MyLostAccount', 'https://www.mylostaccount.org.uk'),
  ('GB', 'CAA — UK261 denied boarding', 'https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/denied-boarding/'),
  # CA
  ('CA', 'CFIA & Health Canada — recalls', 'https://recalls-rappels.canada.ca'),
  ('CA', 'ECCC — GeoMet weather alerts (wired)', 'https://api.weather.gc.ca/collections/weather-alerts/items?limit=1&f=json'),
  ('CA', 'ECCC — human warnings page', 'https://weather.gc.ca'),
  ('CA', 'CanLII', 'https://www.canlii.org'),
  ('CA', 'BoC — unclaimed property portal', 'https://www.unclaimedproperties.bankofcanada.ca/'),
  ('CA', 'CTA — APPR', 'https://otc-cta.gc.ca/en/airlines-and-other-rms'),
  # AU
  ('AU', 'TGA — alerts & recalls', 'https://www.tga.gov.au/safety/alerts-and-recalls'),
  ('AU', 'FSANZ', 'https://www.foodstandards.gov.au'),
  ('AU', 'BOM — national warnings', 'https://reg.bom.gov.au/australia/warnings/'),
  ('AU', 'AustLII', 'https://www.austlii.edu.au'),
  ('AU', 'ASIC MoneySmart', 'https://moneysmart.gov.au/find-unclaimed-money'),
  ('AU', 'Infrastructure — aviation consumer', 'https://www.infrastructure.gov.au/infrastructure-transport-vehicles/aviation/aviation-consumer-protections'),
  # GL
  ('GL', 'WHO — DON portal', 'https://www.who.int/emergencies/disease-outbreak-news'),
  ('US', 'IRS — unclaimed refunds', 'https://www.irs.gov/refunds'),
  ('US', 'FDIC — long-lost bank account guide', 'https://www.fdic.gov/consumer-resource-center/2020-12/how-find-long-lost-bank-account-or-safe-deposit-box'),
  ('US', 'FDIC — bank failures / unclaimed funds', 'https://www.fdic.gov/bank-failures'),
  ('US', 'PBGC — Missing Participants', 'https://missingparticipants.pbgc.gov/'),
  ('US', 'DOL EBSA — Abandoned Plans', 'https://www.dol.gov/agencies/ebsa/employers-and-advisers/plan-information-and-registers/abandoned-plan-search'),
  ('GB', 'HMRC — Marriage Allowance', 'https://www.gov.uk/marriage-allowance'),
  ('GB', 'DWP/HMRC — Pension Tracing', 'https://www.gov.uk/find-pension-contact-details'),
  ('GB', 'FSCS', 'https://www.fscs.org.uk/'),
  ('CA', 'CRA — uncashed cheques', 'https://www.canada.ca/en/revenue-agency/services/e-services/cra-login-services/uncashed-cheques.html'),
  ('AU', 'ATO — lost & unclaimed super', 'https://www.ato.gov.au/individuals-and-families/super/keeping-track-of-your-super/lost-and-unclaimed-super'),
  ('GL', 'ECC-Net — European Consumer Centres', 'https://www.eccnet.eu/'),  ('GL', 'WHO — news English RSS (wired)', 'https://www.who.int/rss-feeds/news-english.xml'),
  ('GL', 'OECD GlobalRecalls', 'https://globalrecalls.oecd.org'),
  ('GL', 'WMO', 'https://public.wmo.int'),
  ('GL', 'ICAO — legal', 'https://www.icao.int/secretariat/legal'),
  # Claim targets (Recover view)
  ('CLAIM', 'MissingMoney (NAUPA)', 'https://www.missingmoney.com'),
  ('CLAIM', 'Treasury Hunt', 'https://www.treasurydirect.gov/savings-bonds/treasury-hunt/'),
  ('CLAIM', 'US Courts — unclaimed funds', 'https://www.uscourts.gov/court-programs/bankruptcy/unclaimed-funds-bankruptcy'),
  ('CLAIM', 'Bona Vacantia', 'https://www.gov.uk/government/organisations/bona-vacantia'),
  ('CLAIM', 'MyLostAccount', 'https://www.mylostaccount.org.uk'),
  ('CLAIM', 'BoC — unclaimed property', 'https://www.unclaimedproperties.bankofcanada.ca/'),
  ('CLAIM', 'BC Unclaimed Property Society', 'https://unclaimedproperty.ca'),
  ('CLAIM', 'ASIC MoneySmart', 'https://moneysmart.gov.au/find-unclaimed-money'),
  # FDA recall file (source links from Guard scanner)
  ('WIRE', 'FDA accessdata recall index (source links)', 'https://www.accessdata.fda.gov/scripts/ires/index.cfm'),
  # Live API endpoints
  ('WIRE', 'openFDA — food enforcement (wired)', 'https://api.fda.gov/food/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=1'),
  ('WIRE', 'openFDA — drug enforcement (wired)', 'https://api.fda.gov/drug/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=1'),
  ('WIRE', 'openFDA — device enforcement (wired)', 'https://api.fda.gov/device/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=1'),
]

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
today = datetime.date.today().isoformat()
rows = []
for market, name, url in URLS:
    try:
        out = subprocess.run(['curl', '-sS', '-o', '/tmp/verify_body', '-w', '%{http_code}', '-L',
                              '--max-time', '25', '-A', UA, url],
                             capture_output=True, text=True, timeout=30)
        code = out.stdout.strip() if out.returncode == 0 else '000'
        try:
            body = pathlib.Path('/tmp/verify_body').read_text(errors='ignore')
        except Exception:
            body = ''
        cors = ''
        if code.isdigit() and 200 <= int(code) < 300:
            h = subprocess.run(['curl', '-sS', '-o', '/dev/null', '-D', '-', '-L', '--max-time', '25',
                                '-A', UA, '-H', 'Origin: https://4173-sandbox.e2b.app', url],
                               capture_output=True, text=True, timeout=30).stdout.lower()
            cors = 'ACAO:*' if 'access-control-allow-origin: *' in h else ('no-cors' if 'access-control-allow-origin' not in h else 'cors-other')
        verdict = ('OK' if code.startswith(('2', '3')) else
                   'BOT-WALLED' if code == '403' else
                   'DEAD' if code.startswith(('4', '5')) else 'UNREACHABLE')
        rows.append((market, name, code, verdict, cors, url))
        print(f'{verdict:12} {code:4} {cors:8} {market:5} {name}')
    except Exception as e:
        rows.append((market, name, 'ERR', 'UNREACHABLE', '', url))
        print(f'UNREACHABLE ERR       {market:5} {name} ({e})')

report = pathlib.Path('reports') / f'link-audit-{today}.md'
lines = [f'# Petty — link audit {today}', '',
         'Method: curl -L, browser UA, 25 s timeout, separate CORS preflight probe. `ACAO:*` = embeddable cross-origin.',
         '', '| Market | Feed | HTTP | Verdict | CORS | URL |', '|---|---|---|---|---|---|']
for m, n, c, v, cors, u in rows:
    lines.append(f'| {m} | {n} | {c} | {v} | {cors or "—"} | {u} |')
counts = {}
for _, _, _, v, _, _ in rows: counts[v] = counts.get(v, 0) + 1
lines += ['', '## Tally', ''] + [f'- {v}: {n}' for v, n in sorted(counts.items(), key=lambda kv: -kv[1])]
report.write_text('\n'.join(lines) + '\n')
print(f'\nwrote {report} ({len(rows)} URLs)')
