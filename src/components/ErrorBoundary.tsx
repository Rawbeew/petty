/* Petty — error boundary. One broken panel must never take down the app or
 * show a white screen. Calm copy (P9), Try-again resets, nothing ever leaves the device. */
import { Component, type ReactNode } from 'react';
import { TriangleAlert, RotateCcw } from 'lucide-react';

interface Props { children: ReactNode; label?: string }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  override componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    /* nowhere to phone home to — log locally, that's it */
    console.error('[petty] boundary caught:', error, info.componentStack);
  }

  reset = () => { this.setState({ hasError: false, message: '' }); };

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="relative h-full overflow-y-auto pb-20 md:pb-6">
        <div className="p-6 max-w-lg mx-auto">
          <section className="panel p-6 space-y-3" role="alert">
            <div className="flex items-center gap-3">
              <TriangleAlert size={20} className="text-[var(--gold)] shrink-0" aria-hidden />
              <h2 className="font-display text-xl text-[var(--ink)]">This panel broke. You didn't.</h2>
            </div>
            <p className="text-[12px] text-[#c9cddb] leading-relaxed">Something in {this.props.label ?? 'this view'} threw before it finished rendering. Nothing has been filed, sent, posted or lost — your case file and photos live on this device and are untouched.</p>
            {this.state.message && <p className="mono text-[9px] text-[var(--dim)] break-all border border-[var(--line)] rounded-lg p-2">{this.state.message}</p>}
            <button onClick={this.reset} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)]"><RotateCcw size={12} />Try again</button>
            <button onClick={() => { window.location.reload(); }} className="w-full text-center mono text-[9px] text-[var(--dim)] py-1.5 underline underline-offset-4 hover:text-[var(--ink)]">Reload the app</button>
          </section>
        </div>
      </div>
    );
  }
}
