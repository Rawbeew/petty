# Petty Radar — Design System (v3, "First Principles" redesign)
Derived from docs/FIRST_PRINCIPLES.md. References studied (2026-11): Snapblocks (scroll-driven React pattern), Animata (copy-owned MIT components, reduced-motion built-in), Scroll Shaders/Scrolltide (GPU-polite backgrounds: paused off-screen, ≤2× retina, still frame under reduced-motion), 21st.dev (component grammar: cards/heroes/shaders — patterns only, no paid assets), audiocn (shadcn-owned copy model). **No paid assets were purchased; every effect here is self-made CSS/SVG.**

## 1 · Voice & typography
- **Display** (Georgia serif) — verdicts, headlines, wordmark. Authority without volume. Never ALL-CAPS except micro-labels.
- **Mono** (ui-monospace) — kickers, labels, legal citations, chips. The "instrument panel" voice.
- **UI sans** (Inter/system) — body copy, ≤65ch measure, line-height ≥1.6.
- Scale: 11 / 12 / 13.5 / 15 / 19 / 30 — nothing between; avoids muddy hierarchy.

## 2 · Color — semantic only
| Token | Hex | Meaning (never decorative) |
|---|---|---|
| `--gold` | #F2C14E | statute / money / primary action |
| `--cyan` | #59D5F0 | information / API / links |
| `--red` | #FF5A5A | risk / recall severity |
| `--green` | #3DDC97 | verified / synced / safe-absent |
| `--ink` | #E8E6DF | primary text |
| `--dim` | #8A8FA3 | secondary text, labels |
| `--bg` `--panel` `--panel2` `--line` `--line2` | #06080D → #2A3245 | elevation ramp (5 steps, not 12) |

## 3 · Layout & density
- 4px base unit; panel padding 20px; gutters 12–20px (16 default).
- Max content 1600px; two-pane at ≥1280px (`xl`), stacked below.
- Information density target: a scanner result row is readable in ≤2.5s; ledger rows ≤2 lines of title.
- Mobile: single column, bottom nav (thumb zone), ≥44px targets, no horizontal overflow (verified in CI).

## 4 · Motion language (tokens in `src/lib/motion.ts`, classes in `src/design/components.css`)
| Token | Value | Used for |
|---|---|---|
| `--ease-out` | cubic-bezier(.22,1,.36,1) | entrances, reveals |
| `--ease-spring` | cubic-bezier(.34,1.4,.44,1) | verdict pop only |
| `--dur-1` 140ms | chips, dots |
| `--dur-2` 260ms | cards, hover lifts |
| `--dur-3` 520ms | section reveals |
Reveal = fade+16px rise · ledger = 55ms stagger from left · `live-dot` = 2.4s verified pulse · `border-beam` = 7s conic sweep (featured pricing only) · `aurora` = 36s ambient drift (opacity .5, transform-only) · marquee = 46s statutory ticker. **All of it freezes under prefers-reduced-motion.**

## 5 · Components
`Panel/PanelFlat · SectionHeader (kicker/title/right) · Chip(-gold/-cyan/-green/-red) · ConfidenceBadge · StatusChip · EmptyState · BigStat · Stat · GlowCard (mouse-tracked radial) · Reveal/Stagger/PopVerdict · Field (focus ring) · LiveDot`
Rules: chips are 9999px radius, 10px caps mono; primary button = solid gold + black text (max one per panel); ghost buttons = bordered ink; destructive styling never used for primary actions.

## 6 · States (every data surface)
`loading → live | unreachable | empty` — each with icon + one-line meaning + next action. Cached (scraped) vs live (API) never share styling: scraped entries render `CACHED` gold chip + fetch timestamp.

## 7 · Accessibility & performance budgets
- focus-visible: 2px gold ring, 2px offset (all interactive elements)
- Esc closes drawers/menus; focus returns to trigger
- aria-live="polite" on result regions; role=dialog/aria-modal + labelled on verbatim drawer
- GPU-only animation (transform/opacity); no layout thrash; JS bundle ≤ 170KB gzip (motion/react ~45KB of it)
- No layout shift from images (none), CLS ≈ 0; LCP = wordmark (static text)

## 8 · Iconography
Lucide, 1.8–2.5 stroke. Gold for active/accent, cyan links, dim neutrals. Icons never stand alone without a label unless in a labelled button (aria-label).
