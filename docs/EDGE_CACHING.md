# Petty — Edge Caching Policy
*How static assets and the recall cache behave behind a CDN/edge. Information, not advice — as ever.*

## Rules
| Path | Cache-Control | Why |
|---|---|---|
| `/assets/*` (Vite content-hashed JS/CSS) | `public, max-age=31536000, immutable` | Filenames change with content; safe to cache forever at the edge and in the browser. |
| `/index.html`, `/`, `/*.html` | `no-cache` | Must revalidate every load — this is how a deploy ships instantly. |
| `/recall-cache.json` | `public, max-age=300, stale-while-revalidate=3600` | Scraped recall portals, refreshed by cron commit. 5-minute edge freshness; stale-while-revalidate up to 1h. The UI prints `generated_at` next to every entry, so stale-but-labelled is honest. Browser revalidates every load (`cache: 'no-cache'` in `src/lib/recallCache.ts`) and 304s are allowed. |
| `favicon.svg` (data URI in `index.html` — n/a) | — | Icon is inline; nothing to cache. |

## Host matrix
| Host | Config | Ships |
|---|---|---|
| Netlify | `public/_headers` | ✅ copied into `dist/` at build |
| Cloudflare Pages | `public/_headers` | ✅ same file format |
| Vercel | `vercel.json` (repo root) | ✅ `headers` array, same rules |
| GitHub Pages | **not supported** — GH Pages sets its own `max-age=600` and ignores header files | ⚠️ assets hashed → fine in practice; `recall-cache.json` freshness relies on the 10-min default |
| Self-host / S3+CDN | translate table above into your CDN behaviours | — |

The Arena/sandbox preview serves `dist/` directly and ignores `_headers`/`vercel.json` — headers apply only on the real static host.

## Deliberately not cached at the edge
- **Agency wires** (openFDA, NWS, CPSC, police.uk, …) are fetched browser→agency, CORS-open, directly. Petty does not proxy them through an edge function — an intermediary would break the "straight from the agency" provenance story and add a failure mode we would have to own. If a future build adds an edge proxy for rate-limited agencies, it needs its own decision record and per-endpoint TTLs, reviewed against the honesty contract.
- **Firecrawl output** travels as `recall-cache.json` only (see INGESTION.md) — cached per the table, never per-request scraped.
- **Nothing personalised exists** — no cookies, no auth — so there is no private data to keep out of the shared edge cache. `public` is correct everywhere above.
