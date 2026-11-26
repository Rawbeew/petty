# Petty — lawful revenge, delivered

> Legal pettiness to the core. Petty is a free, static web app that helps ordinary people exercise small, statute-backed rights — baggage and fee refunds, tenant deposits, unpaid wages, unclaimed property, recalls — using **published, public, attributed sources only**.

**Status:** v2.2.0 · US launch ring live · repo is public · single-maintainer
**Doctrine:** citation or silence · no LLM in the compliance path · flat fees or free · information, not legal advice · you always send the letter yourself · nothing public, ever (no reviews, no shaming)

## The honesty contract

1. **Citation or silence.** Every figure, verdict and alert traces to a linked, dated, attributed public source or to a statute in this repo. If we can't link it, we don't show it.
2. **Failure states are designed.** Loading · live · unreachable · empty — four states, all rendered with intent. Unreachable is *named*, never papered over.
3. **The device is the vault.** Household ledger, evidence photos, case file, reminders — origin-scoped IndexedDB/localStorage. No account. No upload. Petty has no server to receive your data.
4. **Deterministic engines.** Statutes are pure functions (`src/statutes.ts`, `src/lib/packets.ts`) — no AI, no guessing, no “probably”. SDR rates and fee tables carry `verifiedAt` stamps; verify against the primary source before filing.
5. **Not a lawyer.** Information, not advice; not affiliated with any agency; flat subscription or free; no success fees, ever.

## Quickstart

```bash
npm ci            # Node 20+
npm run dev       # local dev server
npm run gate      # lint + statutes/packets/complaints/courtlistener/reminders tests + tsc + production build
npm run build     # production build (static SPA, no server needed)
```

## What's inside

| Surface | Owns |
|---|---|
| **Side-Eye** (Radar) | Live agency signals — recalls, weather hazards, public data. Every merged signal passes the **eligibility gate** (`src/lib/pipeline.ts`): no https source, parseable date and known confidence class → dropped and counted, never rendered |
| **Receipts** (Guard) | Recall scanner (openFDA + FSA) · docket watchdog (CourtListener, token or deep-link) · **The Pantry** (household goods ledger, on-device — with optional best-by/expiry watch wired to the Clockwatch) · Label Lies (food fraud) |
| **Comeuppance** (Recover) | Deterministic engines: EU261/DOT/Montreal/APPR baggage · tenant deposit (NY/CA/TX/FL/IL) · unpaid wages (FLSA § 216(b) + NY/CA layers) · US settlement watchlist · **Clockwatch** (on-device deadline reminders) · **Complaint Desk** (9 lanes, 50 states + DC AG routing, audited) |
| **The Black Book** (Vault) | 46-row regulator registry with audited statuses (WIRED/PORTAL/BOT-WALLED/UNVERIFIABLE) + tariff docket watch (importers only) |

The chain is the product: **Scanner → Pantry → case file → Complaint Desk** — one tap apart, one on-device narrative, zero network hops.

## The signal pipeline (architecture)

```
retrieve  live.ts (openFDA · CPSC · NWS · FSA · WHO · CourtListener)
   ↓
ELIGIBILITY GATE  lib/pipeline.ts — citation or silence as a stage,
                   not a promise: drop + count what fails
   ↓
RANK (UI only)    severity/freshness ordering — legal verdicts are
                   never ranked, packets are pure statute functions
   ↓
ACT               letter / claim packet / complaint — always yours to send
```

Eligibility is never a function of prominence: a critical severity cannot outrank a missing source. GuardView’s recall scanner shows verbatim agency records only; the Radar’s merged feed shows live API signals that name their source.

## Repo map

```
src/
  config/billing.ts   # flat-plan config — links, prices, honor-system entitlement
  statutes.ts        # baggage engines — deterministic; SDR_VERIFIED_AT stamp
  lib/               # engines & infra: packets, complaints (router + letters), courtlistener,
                     # household (IndexedDB), reminders (Clockwatch), caseFile, safeStorage, print
  components/        # views + cards (one job per screen)
  data/              # registries: packets (statutes, settlements), states (50+DC AG portals, audited), packs
scripts/             # tests (tsx, run in gate) + verify_links.py (registry audit) + ingest_recalls.py (cron)
reports/             # paper trail: link-audit, settlements-audit, ag-audit (dated)
docs/                # FIRST_PRINCIPLES.md (P1–P10, PV1–PV4), EDGE_CACHING.md
.github/workflows/   # ci.yml (gate on every push) + link-audit.yml (weekly, report-only)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run gate` | The full gauntlet: `eslint --max-warnings=0` + six tsx assertion suites + `tsc -b` + `vite build` |
| `npm run test` | Engines only (no lint, no build) |
| `python3 scripts/verify_links.py` | Re-audits every registry URL; writes `reports/link-audit-<date>.md`; **exits 0 always** (audit, not gate) |

## Honesty infrastructure

- Every external link in the registry carries a dated audit (`reports/link-audit-2026-11-26.md`, `reports/ag-audit-2026-11-26.md`). Bot-walled sites are linked *labeled*; unreachable sites are named, dated, **not linked**.
- Settlement watchlist entries are fetch-verified before they ship and render **EXPIRED** after their deadline.
- Letters are templates with your facts — statute citations are real, remedies are real, outcomes are never promised.

## Not built yet / honestly labeled

AU recall & safety data has no machine-readable open dataset — AU is portal framing, honestly labeled; CA ships a weekly CI-built snapshot of Health Canada’s open data (verbatim, attributed, dated). One maintainer — the CI gate is a floor, not a guarantee.

## Billing — “The Household” (flat $9/mo · $79/yr, 6 seats)

The free law stays free: statute engines never paywalled; statute-clock imports (deposit / complaint) never capped. Free manual Clockwatch = 5 open clocks; unlimited with the plan. Entitlement is **self-reported on-device** — Petty has no accounts, so billing is wiring, not a backend. This build ships with checkout **disabled** (honest “not charging yet” panel) until the Stripe links exist.

To open billing (≈20 min, one time):

1. Create a Stripe account → **Products**: “Petty Household — Monthly” $9.00 USD recurring · “Petty Household — Annual” $79.00 USD recurring.
2. Create a **Payment Link** for each. Set each link’s post-payment redirect to `https://<your-domain>/?billing=household`.
3. Enable the **Customer Portal** (manage/cancel self-serve) and copy its login URL.
4. Paste the three URLs into `src/config/billing.ts` (`monthlyLink`, `annualLink`, `portalLink`), commit, deploy.

Until then nothing charges and no dead checkout buttons render. Clearing browser data reverts the device to the free tier — users re-enter via the portal link; Stripe handles renewals, dunning and cancellation. Founding price is locked for members forever (by copy, not by code — the rate lives in Stripe).

## License & repo policy

Licensed **Apache-2.0** — see `LICENSE`. Public repo, issues **open**: scrutiny is a feature. Please quote the “verified” date next to any figure you challenge; statute text and settlement windows change. Success-fee forks are expected and are precisely why the moat is audits, not secrecy.

## Not legal, financial, or medical advice

Petty is an information tool. Statutes simplified for triage; verify against current primary sources before filing or acting. You are responsible for what you file. See `pettymanifesto.md` for why it exists.
