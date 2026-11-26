/* Motion language — "SCAN": every movement is emitted by the scope, never pasted on.
 * Variants answer one question each: what just arrived, where is the truth, what can I do.
 * Single source of truth for Petty's animation language. */
import { stagger, type Variants } from 'motion/react';

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];        /* hard decel — terminal feel */
export const EASE_SPRING: [number, number, number, number] = [0.34, 1.35, 0.44, 1]; /* verdict pop only */
export const DUR = { micro: 0.12, base: 0.34, sweep: 0.5 } as const;

/* sweepIn — panel revealed by a moving scanline: clip wipes left→right */
export const sweepIn: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  shown: { opacity: 1, clipPath: 'inset(0 0% 0 0)', transition: { duration: DUR.sweep, ease: EASE_OUT } },
};

/* ledgerItem — agency events land like returns: slide in, saturation ramps to full */
export const ledgerItem: Variants = {
  hidden: { opacity: 0, x: -14, filter: 'saturate(0.4)' },
  shown: { opacity: 1, x: 0, filter: 'saturate(1)', transition: { duration: DUR.base, ease: EASE_OUT } },
};

export const staggerParent: Variants = {
  hidden: {},
  shown: { transition: { delayChildren: stagger(0.06, { startDelay: 0.08 }) } },
};

/* popVerdict — reserved for statutory verdicts and scan results: springy, singular */
export const popVerdict: Variants = {
  hidden: { opacity: 0, scale: 0.82, y: 10 },
  shown: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: EASE_SPRING } },
};

/* tactile — press physics for every primary action */
export const whileTap = { scale: 0.96 } as const;
