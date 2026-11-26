# The Petty Manifesto
*Lawful revenge, delivered. Legal pettiness to the core.* | Raw open-government data · zero fabrication · flat subscriptions · information, not advice.

Petty: the honest engine, rebuilt with a spine. Petty collects the debts statute and enforcement culture actually owe ordinary people — EU261, DOT 14 CFR 254, Montreal 1999, CTA APPR, unclaimed balances, recall exposure — flattened into one screen, with citations.

## What it is (and what it refuses to be)
| It is | It refuses |
|---|---|
| A YMYL radar of **agency-published** enforcement/statutory facts with source links on every item | Invented signals, fake matches, "trust us" claims |
| A **deterministic** statutory engine (no LLM in the compliance path) | Advice, gesturing at legal outcomes, success fees |
| An audit-trailed regulator registry (`reports/link-audit-2026-11-26.md`) | Decorational links with no verification |
| Everyone's patient, relentless advocate for €250–€600 | Mass-complaint tooling, harassment, defamation |

## Quickstart
```bash
npm ci
npm run gate      # eslint --max-warnings=0 · statutory unit tests · build
python3 scripts/verify_links.py   # re-audit every URL → reports/link-audit-<today>.md
python3 scripts/crosscheck3.py    # Playwright end-to-end: live wires, scans, export, mobile
```

## Architecture
`AGENCY → src/lib/live.ts (wires) → views (select) → ACT (statutes.ts / claim packets / Safety Card)`
Doctrine map: **docs/FIRST_PRINCIPLES.md** (why the product exists) · **DESIGN.md** (Petty voice, systems model, SCAN motion language, UX law) · **DESIGN_SYSTEM.md** (v3 token architecture & component grammar).
Surfaces own single responsibilities — Radar (recalls/weather/police/unclaimed gateways) · Guard (FSA+openFDA recall scanner · CourtListener docket · UK Find Case Law judgments lane · Field Wire) · Recover (statutory money engines) · Country Vault (audited regulator registry).

## Data sources (all verified 2026-11-26 · keyless · CORS-open unless noted)
openFDA enforcement · CPSC recalls API · NWS api.weather.gov · NYPD Socrata · FSA Food Alerts (OGL v3) · data.police.uk (OGL v3) · Find Case Law (OJL) · ECCC GeoMet · WHO News RSS (90-day window) · GOV.UK drug-device alerts (portal link; atom not CORS-open)

Unverifiable/unavailable markets ship **explicitly as such** — AU radar, CA/AU recall scanner. No third state exists.

## Repo layout
`src/data/signals.ts` (one vocabulary) · `src/data/packs.ts` (registry) · `src/statutes.ts` (deterministic engines + tests) · `src/lib/live.ts` (wires) · `src/components/` (surfaces) · `scripts/` (gate, audit, e2e) · `reports/` (audit logs) · `docs/` (doctrine + EDGE_CACHING.md) · `DESIGN.md` · `DESIGN_SYSTEM.md` (doctrine map) · `INGESTION.md` (Firecrawl contract, server-side only) · `_headers`/`vercel.json` (edge cache)

## The Petty Ledger
Radar surfaces verified **official gateways** for money governments are holding for you — IRS unclaimed refunds, FDIC failed-bank deposits, PBGC missing pensions, DOL abandoned plans (US) · Marriage Allowance backdating, Pension Tracing, FSCS, Bona Vacantia (GB) · CRA uncashed cheques, BoC (CA) · ATO lost super (AU) · ECC-Net cross-border disputes (GL). **No API exists anywhere for unclaimed money — Petty links, never fabricates.**

## Edge caching
Hashed `/assets/*` are `immutable` for a year; `index.html` revalidates every load; `recall-cache.json` gets 5-minute edge freshness with stale-while-revalidate (freshness is printed next to every scraped portal entry). Configs: `public/_headers` (Netlify/Cloudflare Pages) and `vercel.json` (Vercel). Policy, host matrix and exclusions: **docs/EDGE_CACHING.md**.

## Honesty contract
Citation or silence · labelled live-or-unavailable · named failures with official links · verbatim traceability · YMYL: information, not advice · not affiliated with any agency/court · flat pricing.

**Live app. Zero demo mode. Zero fabricated data.**
