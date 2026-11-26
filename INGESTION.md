# Petty — Firecrawl ingestion & discovery (server-side only)

Decision (2026-11-26): Firecrawl is used for **server-side ingestion of public recall portals that publish no
keyless JSON/RSS/CORS feed**, plus **analyst discovery search**. Never in the browser bundle, never behind a
"LIVE" badge, never on WAF/licence-walled sources.

## Engine options (verified 2026-11-26)
| Option | How | Cost | Notes |
|---|---|---|---|
| Firecrawl cloud | `FIRECRAWL_API_KEY=fc-…` | free tier ≈500 credits/mo; ~$16/mo for ~3k | fastest to activate |
| Self-hosted OSS | `https://github.com/firecrawl/firecrawl` → `docker compose up` | infra only | **AGPL-3.0 — see licence section; needs Docker + Redis + Postgres + Playwright; ~2–4 GB RAM** |

Self-hosting cannot run inside this CI sandbox (no Docker, ~1 GB RAM). It is for the build/cron host.
Point the script at it with `FIRECRAWL_API_URL=http://localhost:3002` (auth optional there).

## What runs where
| Piece | Where | Key needed |
|---|---|---|
| `scripts/ingest_recalls.py` | build/cron host | `FIRECRAWL_API_KEY` (cloud) or `FIRECRAWL_API_URL` (self-host) |
| `public/recall-cache.json` (output) | same-origin static asset | none |
| `GuardView → IngestedPortals` | browser, reads cache only | none |
| `scripts/firecrawl_search.py` | analyst CLI | same env vars |

## Sources ingested (all others stay keyless-wire-only)
FSIS recalls (US) · TGA alerts & recalls (AU) · Anvisa recolhimento (BR) · EU Safety Gate weekly reports (EU) ·
CFIA/Health Canada (CA) · MHRA drug & device alerts (GB fallback — its atom feed has no CORS).
Never scraped: openFDA, CPSC, FSA, ECCC, NWS, NYPD, police.uk, Find Case Law, WHO (already keyless), CanLII,
AustLII, or any WAF/licence-walled/paywalled/login-walled page.

## Honesty contract
1. Scraper stores **verbatim** markdown + provenance (url, fetched_at). No summarisation, no invented recalls.
2. Fetch failure → `{status:"unreachable", error}` in the cache — the UI shows **UNREACHABLE**, never filler.
3. Suspect content (bot-wall/CAPTCHA markers, <400 chars) → flagged as `suspect`, never shown as an alert.
4. If **all** sources fail the run, the previous cache is kept (or nothing is written). A bad run can never
   blank or poison a good cache.
5. Writes are **atomic** (tmp → rename). Readers never see a half-written file.
6. Firecrawl Search output is **discovery, not evidence** — labelled as such, human-triaged into
   `reports/`, never rendered in the app.
7. robots.txt/ToS respected per source; Petty is not a compliance determination — YMYL, info not advice.

## Edge cases (what happens, by design)
| Edge case | Handling |
|---|---|
| Cloud key absent / self-host URL unreachable | Script exits 1/2, cache unchanged — nothing renders |
| HTTP 4xx/5xx from Firecrawl | Entry `unreachable` with `error: http NNN …` |
| Page is JS-only, markdown comes back empty/short | <400 chars → `empty`; nothing presented as data |
| Bot-wall/CAPTCHA interstitial instead of portal | marker match (`access denied`, `captcha`, …) → `suspect`, quarantined |
| Portal redesign moves recalls out of the main content | `onlyMainContent` + marker check; failures surface as `unreachable`, not wrong data |
| Portal huge (thousands of recalls) | markdown truncated at 200 KB; truncation is logged — never mid-page silent loss |
| Source legitimately has no new recalls | page still renders structurally → `ok` with real content; zero-alert pages are valid output |
| Encoding/mojibake in source | markdown passes through as UTF-8; mojibake remains the source's text (verbatim) |
| Partial failure (3 ok, 3 down) | cache written with mixed statuses; UI shows per-source chips — stale is visible |
| All sources down this run | previous cache kept untouched (exit 2) — worst case is last-known-good, labelled with its fetch time |
| Cache file deleted/corrupt on CDN | `loadRecallCache()` schema-validates (`petty.recall-cache/v1`); invalid → `null` → UI renders nothing |
| Stale cache (cron dies) | `generated_at` rendered next to the list; anything >24h old should be considered cold |
| Duplicate/contradictory recall across sources | possible by design — each entry carries its own source+timestamp; conflicts are not auto-resolved |
| Time zones / mixed date formats | `generated_at` is UTC ISO-8601; portal text stays in the portal's own format |
| Firecrawl engines differ (fetch vs playwright) | cloud picks engine; self-host defaults `playwright` for JS-heavy SPAs (Safety Gate is one) — slower but renders |
| robots.txt disallows a path | Firecrawl refuses and returns empty/error — entry shows `unreachable`, we do not retry around it |
| Rate limits / 429 | entry `unreachable` with the HTTP code; next cron retries — no backdoor retries |
| AGPL-3.0 of self-hosted Firecrawl | Internal use/self-hosting to generate our own cache is fine; *distributing our own modified Firecrawl over a network* triggers source-offer duties. Petty does not — we call it as a service. Get legal sign-off before exposing a modified instance to users. Not legal advice. |
| Credential leak | key lives in env/cron secret only; `recall-cache.json` contains no secrets (public portal markdown) |
| PII in scraped pages | recall notices are business/product identifiers; entry passes through verbatim — no enrichment |
| Portal page contains its own tracking links | links render as-is to the source; we never proxy-rewrite them |
| "Firecrawl search found a recall" | never rendered. Discovery CLI prints URLs for a human to verify against the agency site |

## Cost & cadence
Cloud free tier: 1 full 6-source crawl/day ≈ 180 credits/mo — fits. Paid tier (~$16/mo, ~3k): daily cron + discovery headroom.
Self-host: infra cost only; Playwright workers are the heavy part.

## Activation
```
# cloud
FIRECRAWL_API_KEY=fc-... python3 scripts/ingest_recalls.py
# or self-hosted (docker compose up in a checkout of github.com/firecrawl/firecrawl)
FIRECRAWL_API_URL=http://localhost:3002 python3 scripts/ingest_recalls.py
git add public/recall-cache.json && git commit -m "recall cache refresh" && git push
```
(Recommended: GitHub Actions cron → same commit → app shows freshness.)
