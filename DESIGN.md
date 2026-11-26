# PETTY — Design Doctrine
*Lawful revenge, delivered. Legal pettiness to the core.*

> **Scope:** Petty voice, systems model, SCAN motion language, UX law and UI craft. The v3 token architecture and component grammar live in **DESIGN_SYSTEM.md**; the underlying why lives in **docs/FIRST_PRINCIPLES.md**. If this doctrine and the token system ever disagree, the doctrine wins on *voice and intent*; the token system wins on *implementation*.

This is not a skin. It is the operating system of the product. Everything visible below exists because a first principle demanded it, and everything interlocks (systems thinking). If a future change violates a principle here, the change is wrong — or this document must be amended deliberately, in writing.

## 1 · First principles (why Petty exists)

**P1. The agencies are not on your side — but the statute is.**
Governments publish exactly what they must: recalls, alerts, caps, fee tables, statutory deadlines. The asymmetry is not information, it is *attention*. Petty sells attention, flattened into one screen, priced flat.

**P2. Nobody owes you an apology; some actors legally owe you money.**
EU261, DOT 14 CFR 254, Montreal 1999, CTA APPR, unused-ticket refunds, unclaimed property, regulated recalls. These are *debts with statutory interest-free due dates*. Petty is a collections agent for the statistically true little grudges of ordinary life.

**P3. Citation or silence.**
Every claim in the product resolves to a linked, dated, attributed public source. If we cannot link it, we do not show it. This is the whole YMYL bargain: we are relied on for decisions about safety and money, so we never hallucinate, never "probably", never fill a gap with vibes.

**P4. Pettiness is procedural, never performative.**
One user, one genuine grievance, one lawful channel — never mass-complaints, never harassment, never falsehoods. The edge lives in *voice and relentlessness*, never in illegality or deception. Guardrails are features: they keep Petty defensible, app-store-safe, and bar-compliant (flat fees, no success fees, info-not-advice).

**P5. Speed is a feature of the mask; quiet is a feature of the engine.**
The voice is sharp. The data path is sober. Sass lives in microcopy and empty states; never in a citation, a figure, or a verdict.

**P6. Mobile is the courtroom; desktop is the chambers.**
Every flow must complete one-thumb on a phone (bottom nav, 48px targets, zero horizontal scroll) — because the person who discovers a recall at a supermarket shelf will not wait for a laptop.

## 2 · Systems thinking (how it interlocks)

```
AGENCY (source of truth)
   │  CORS-keyless JSON/RSS/ATOM  •  or explicit "unverifiable/unavailable" — never a third state
   ▼
WIRE  (src/lib/live.ts)           normalises → SafetySignal { id, pillar, severity, confidence,
   │                               publishedAt, sourceUrl, rawOfficialText … }
   ▼                               zero transformation of meaning — labels + links only
SELECT (Side-Eye/Receipts views)        filters by pillar/severity/query — stateless over the pool
   ▼
ACT    (Comeuppance / drawer / Safety Card export)   statutory engines are DETERMINISTIC (src/statutes.ts)
ENDPOINT                          link-out to the agency that can actually act
```

**Surfaces (single responsibility — no surface creeps):**

| Surface | Owns | Never shows |
|---|---|---|
| **Side-Eye** | "What's on *right now*?" — recalls, weather hazards, police/stops, and the unclaimed-money gateways | court dockets, baggage math, legal advice |
| **Receipts** | Recall Scanner (openFDA+FSA) · Docket Watchdog (CourtListener token + UK Find Case Law lane) · Field Wire (police/stops) | statutory compensation verdicts |
| **Comeuppance** | Deterministic money engines (EU261 · DOT 254 · Montreal 1999 · APPR) · claim packets · demand letters | live enforcement feeds |
| **The Black Book** | The 46-row regulator registry with *verified* statuses (WIRED/PORTAL/BOT-WALLED/UNVERIFIABLE/GATED/QUEUED) + flat pricing | signals, claims |

**Failure states are designed, not defaulted:** every async surface has exactly three honest states — `loading` (says who it is contacting), `live` (pulse + "synced Xs ago" — green dot *means* data is on screen), `unavailable` (named reason + official portal — never stale, never invented).

**The registry is a system, not a list:** each row carries license, cadence, status and (when wired) the exact machine endpoint; `scripts/verify_links.py` re-audits all 56 URLs with dates; `reports/link-audit-*.md` is the paper trail. The app cannot drift into lying quietly because the audit is a repeatable command, not a memory.

**Tokens → primitives → surfaces:** `index.css` defines ~20 tokens (colour, easing, duration); `src/lib/motion.ts` defines 5 variants; `src/components/Motion.tsx` exposes 4 primitives; views compose primitives only. Same discipline as the data path: one vocabulary, narrow transformations, no ad-hoc styles.

## 3 · UX law, applied

- **Fitts** — primary actions are 44–52px, thumb-anchored (bottom nav on mobile); destructive/forget actions are deliberately small.
- **Hick** — 4 tabs, 4 nav items, 5 severities, 4 Side-Eye pillars. Every choice list was cut to what fits working memory (Miller).
- **Jakob** — feed + scope split (familiar from every tracker/dashboard), standard drawers, standard select styling. Novelty is rationed to moments of delight, never to how you "close" something.
- **Doherty < 400ms** — local filters are synchronous; agency calls show named contact state, re-sync is one tap; skeleton-free by design (no layout shift).
- **Reading law** — statutory ticker pauses on hover/focus; paragraphs cap at ~68ch; mono for machine text, serif only for verdicts and display.
- **Peak–end** — the statutory verdict (€250/€400/€600) pops with the only spring in the product; the Safety Card export is a shareable receipt of being right.

## 4 · Motion language — "SCAN" (changed from fades to scan)

Motion in Petty is **emitted by the scope, never pasted on**. One question per variant:

| Variant | Trigger | Feeling | Budget |
|---|---|---|---|
| `sweepIn` | panel enters viewport | scanline wipes L→R with content behind | 500ms · easeOut `[0.16,1,0.3,1]` |
| `ledgerItem` | agency event arrives | slides in on x‑14, saturation ramps to full | 340ms |
| `staggerParent` | list mounts | 60ms cascade, 80ms lead | — |
| `popVerdict` | statutory verdict computed | single spring overshoot — the ONLY spring (peak–end) | 400ms · `[0.34,1.35,0.44,1]` |
| `whileTap` | any primary press | compress 4% — evidence you were heard | 120ms |
| ticker marquee | always, 46s loop | **pauses on hover/focus** (reading law) | linear |
| `.live-dot` | only when data on screen | 2.4s green pulse — a *truthful* signal | — |

**Hard rules:** transform/opacity/clip-path only (compositor, 60fps); `prefers-reduced-motion` collapses ALL of it to zero — content is fully usable with motion off (P6/P4); no parallax, no scroll-jacking, no bounce except the verdict; the aurora background is a single slow conic sweep (24s) at 5% opacity — ambience, not choreography.

## 5 · UI craft

- **Palette** — phosphor-on-black `#06080d`, panel `#0b0e14→#10141d`, gold `#f2c14e` (verdicts, primary), cyan `#59d5f0` (linked truth), green `#3ddc97` (verified live), red `#ff5a5a` (critical). Contrast ≥ AA on all text (dim `#8a8fa3` is for chrome only, never body copy).
- **Type** — Georgia display for verdicts & wordmark (institutions, law libraries), Inter for UI, ui-monospace for machine voice/data/chips. Three voices, assigned by role, never mixed within a sentence.
- **The grid** — 4px base; panels radius 1.1rem; one gold primary action per view; everything else is bordered glass. Depth via `panel2` + hairline lines, never shadows except hover lift (`card-hover`).
- **Restraint budget** — one "luminous" element per screen (the scope, or the verdict, or the beam on the featured tier). Two glows = zero.

## 6 · What was deliberately NOT taken from the references

Snapblocks/Animata (component glamour), Scroll Shaders/Scrolltide (paid WebGL shelves), audiocn (audio-app kits), 21st.dev (agent-fed component marketplace): all were read, none were copied — paid assets and unlicensed code stay out; the *principles* were extracted (mask-to-basics primitives, reduced-motion as a designed state, shaders pause off-screen, stagger as information) and re-derived as Petty's own SCAN language. Ethical bar identical to our data bar: inspiration in, original pixels out.

## 7 · Honesty contract (unchanged, restated)

1. No fabricated data, ever — citation or silence. 2. Live means synced-on-screen with a timestamp. 3. Dead/unreachable is *named* (with official portal links), never covered. 4. Money gateways: no fake matches — no API exists, we say so. 5. YMYL: information, not advice; not affiliated with agencies; flat pricing only.
## 8 · The device is the vault (privacy doctrine, 2026-11-26)

- Household ledger (The Pantry) and evidence photos are origin-scoped IndexedDB — no account, no upload, no sync. UI copy never says "backed up" or "secured"; it says PERSISTED (asked) or MAY BE EVICTED, and tells you to export what matters.
- Photo capture is one tap (`capture="environment"`), photos show size/date, download individually, delete per-photo or per-item (item delete cascades to its photos).
- "Report it" only ever routes to official regulators (health dept · FDA/USDA FSIS · state AG · FTC · FCC · CFPB · CPSC · DOL) with a generated complaint letter the **user** sends — Petty never files and never publishes. No reviews, no ratings, no callouts, no shame walls. Voice sharp, engine sober — the desk is a clerk, not a mob.
- Canon: `docs/FIRST_PRINCIPLES.md` PV1–PV4.
