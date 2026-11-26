/* Statutory ticker — law, not headlines. Duplicated for seamless loop;
   second copy aria-hidden. Pauses on hover; frozen under reduced-motion. */
const TICKER_FACTS = [
  '14 CFR Part 254 — checked-bag fees auto-refund at 12h (domestic) · 15h (intl ≤12h) · 30h (intl >12h)',
  'Montreal 1999 — 1,519 SDR cap · written notice: 7 days damage · 21 days delay',
  'EU261/UK261 — €250 / €400 / €600 fixed compensation by distance band',
  'CTA APPR — C$400 / C$700 / C$1,000 large-carrier delay & denial schedule',
  'YMYL — citation-or-silence · Petty never sells finder’s fees, only flat subscriptions',
].join('   ·   ');

export default function Ticker() {
  return (
    <div className="relative z-10 border-b border-[var(--line)] bg-[#080a10] h-8 overflow-hidden flex items-center marquee-wrap" aria-label="Statutory facts ticker">
      <div className="marquee mono text-[9px] tracking-[0.12em] text-[#a9b0c8] pl-4">
        <span>{TICKER_FACTS}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;</span>
        <span aria-hidden="true">{TICKER_FACTS}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>
  );
}
