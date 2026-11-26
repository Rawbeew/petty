/* Petty — Terms & honesty. Plain English, one screen, no scroll-walls.
   The persistent strip keeps its short version for md+; this is the full text. */
import { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export default function TermsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Terms and honesty">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--line2)] bg-[var(--panel)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg flex items-center gap-2"><ShieldCheck size={17} className="text-[var(--green)]" aria-hidden />Terms &amp; honesty</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-[var(--panel2)] text-[var(--dim)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="text-[12.5px] leading-relaxed text-[#c9cddb] space-y-3">
          <p><strong className="text-[var(--ink)]">Petty is information, not legal, financial, or medical advice.</strong> Statutes are simplified for triage; fee figures, deadlines and SDR conversions are approximate and dated (see the “verified” stamp next to each figure). Verify against the linked primary source before filing, paying, or acting. You are responsible for what you file. Nothing here creates an attorney–client relationship.</p>
          <p><strong className="text-[var(--ink)]">Citation or silence.</strong> Every signal, settlement and registry entry names a source you can open. If a source is unreachable, bot-walled or unverifiable, it is labeled as such or omitted — never estimated, never invented. Failure states are part of the product, not error dialogs.</p>
          <p><strong className="text-[var(--ink)]">Petty never files anything for you.</strong> Every letter is a template with your facts; you send it. Flat subscription or free — never a success fee, never a percentage of recovery, never affiliated with any agency listed.</p>
          <p><strong className="text-[var(--ink)]">Your data stays on your device.</strong> The household ledger, case file, photos and reminders live in this browser’s storage on this device. Petty has no account system and no server that receives your data. Clearing site data deletes them. (The openFDA/FSA/NWS queries your browser makes are anonymous GETs to public government APIs, containing only your search term.)</p>
          <p><strong className="text-[var(--ink)]">Open source, no warranty.</strong> Petty is licensed Apache-2.0. It is provided “as is”, without warranty of any kind. It is not affiliated with or endorsed by any regulator, court, agency, airline, insurer or retailer mentioned.</p>
          <p><strong className="text-[var(--ink)]">Scope and candor.</strong> CA/AU registries are largely portal-only; phase-2 markets are gated placeholders; one maintainer. Audits and “last verified” dates are snapshots in time — statutes and settlement windows change.</p>
          <p className="mono text-[10px] text-[var(--dim)]">Report errors or dead links: the GitHub repository’s issue tracker. Please quote the “verified” date shown next to any figure you challenge.</p>
        </div>
      </div>
    </div>
  );
}
