# Petty Radar — Firecrawl ingestion & discovery (server-side only)

Decision (2026-11-26): Firecrawl is used for **server-side ingestion of public recall portals that publish no
keyless JSON/RSS/CORS feed**, plus **analyst discovery search**. Never in the browser bundle, never behind a
"LIVE" badge, never on WAF/licence-walled sources.

## What runs where
| Piece | Where | Key needed |
|---|---|---|
| `scripts/ingest_recalls.py` | build/cron host | `FIRECRAWL_API_KEY` |
| `public/recall-cache.json` (output) | same-origin static asset | none |
| `GuardView → IngestedPortals` | browser, reads cache only | none |
| `scripts/firecrawl_search.py` | analyst CLI | `FIRECRAWL_API_KEY` |

## Honesty contract
1. Scraper stores **verbatim** markdown + provenance (url, fetched_at). No summarisation, no invented recalls.
2. Sources already served by keyless wires (openFDA, CPSC, FSA, ECCC, NWS, NYPD, police.uk, Find Case Law,
   WHO) are never scraped — one source of truth per dataset.
3. WAF-403 portals, licence-gated corpora (CanLII, AustLII), paywalls, login pages: **out of scope, permanently.**
4. Fetch failure → entry rendered as UNREACHABLE, never filled with old or invented content.
5. Firecrawl Search output is **discovery, not evidence** — labelled as such, human-triaged into
   `reports/`, never rendered in the app.
6. robots.txt/ToS respected per source; Petty is not a compliance determination — YMYL, info not advice.

## Cost & cadence
Free tier ≈ 500 credits/mo ≈ one full 6-source crawl daily (≈180/mo) + headroom for discovery. At paid tier
(~$16/mo) daily cron is trivially affordable. Cache labels carry fetched_at — stale is visible, not hidden.

## Activation
```
FIRECRAWL_API_KEY=fc-... python3 scripts/ingest_recalls.py
git add public/recall-cache.json && git commit -m "recall cache refresh" && git push
```
(Recommended: GitHub Actions cron → same commit → status shows freshness in the app.)
