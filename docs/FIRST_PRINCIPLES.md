# Petty — First Principles
A redesign is not "make it pop." It is: understand *why* the interface exists, then delete everything that doesn't serve it.

## The 10 laws (every design decision traces to one)

**P1 · Truth before beauty. Citation-or-silence.** If a number/verdict/alert cannot be traced to a live agency source *or a statute in this repo*, it does not render. A spinner, an "UNREACHABLE" chip, or an empty state are *correct UX* when the data isn't there. Emptiness is information; fabrication is betrayal. (YMYL.)

**P2 · One job per screen.** Side-Eye = *see*. Receipts = *check a product*. Comeuppance = *get money back / baggage rights*. Black Book = *audit the supply chain & price*. If an element doesn't serve the view's single job, it moves or dies.

**P3 · The source is the product.** Every claim links to the agency. The UI's job is to get a human to the primary document faster than Google would — never to intermediate, paraphrase into vagueness, or editorialize between the user and the agency.

**P4 · Attention is budgeted, not sprayed.** Bright color (gold/cyan/red/green) is *semantic*, not decorative: gold = money/statute, cyan = information/API, red = risk, green = verified. Neutral ink (`--ink`/`--dim`) carries >85% of pixels. If everything glows, nothing signals.

**P5 · Motion communicates state, or it doesn't exist.** Every animation answers "what changed?" or "where should I look?" — sweep (scanning), stagger-fade (new ledger arrived), pulse dot (verified feed synced now), border-beam (recommended tier). Decorative motion is deleted.

**P6 · Latency honesty.** Perceived speed via optimistic skeletons is a lie when the source is authoritative. Instead: immediate explicit state (`CONTACTING…`), timeout → explicit failure with retry, cached (scraped) data visually distinct from live API data. Never blur the two.

**P7 · Progressive disclosure.** First layer: verdict. Second: evidence (verbatim text, source URL). Third: action (download letter, open portal). Nobody is forced through the funnel; experts jump straight to the verbatim drawer.

**P8 · Hands first, screen second.** Touch targets ≥44px, bottom nav thumb zone on mobile, one-handed flows (Receipts scan → verdict). Keyboard: Tab order matches visual order, Esc closes drawers/menus, focus-visible rings always.

**P9 · Calm interface for anxious moments.** The user may be dealing with a recalled crib, a seized bag, or a missing payout. No gradients-assault, no dark patterns, no countdown timers, no red-urgency copy. The UI lowers heart rate: serif display voice, generous leading, dry legal tone.

**P10 · Reduced-motion is a hard gate.** `prefers-reduced-motion` collapses *all* animation to near-instant; content and affordances are 100% intact. Accessibility is not a lint rule — it's the floor.

## Systems thinking — how the codebase encodes the laws

```
            ┌─────────────────────────────────────────┐
            │  VIEWS (one job each): Side-Eye Receipts Comeuppance Black Book │
            ├─────────────────────────────────────────┤
            │  PATTERNS: ConfidenceBadge · SectionHeader ·  │
            │  EmptyState · StatusChip · Stat · BigStat     │
            ├─────────────────────────────────────────┤
            │  PRIMITIVES: Reveal · Stagger · PopVerdict    │
            ├─────────────────────────────────────────┤
            │  TOKENS: color (semantic) · type · space ·    │
            │  radii · motion (dur/ease) · breakpoints      │
            ├─────────────────────────────────────────┤
            │  CONTRACTS: SafetySignal · RecallCache ·      │
            │  Regulator(status:wired|portal|bot-walled…)   │
            └─────────────────────────────────────────┘
```
Dependencies point downward only. A view never contains a color hex; a pattern never fetches; a primitive never knows a domain concept.

**Failure states are first-class citizens** (P1, P6): every data surface enumerates exactly four states — `loading · live · unreachable · empty` — and renders all four with intent. TypeScript enforces it (discriminated unions / nullable sources).

**Provenance is type-level, not comment-level:** `Confidence` (`verified_agency | anonymized_approx | unconfirmed_dispatch`) is a *required* field on every signal; the UI cannot render an unattributed item because it cannot construct one.

**Zero-fabrication invariant (P1):** no seed/demo data exists in the bundle; absence renders as absence. Gates: `--max-warnings=0`, no `any`, no eslint-disable.
