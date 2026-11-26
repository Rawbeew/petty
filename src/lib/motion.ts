/* Motion variants — single source of truth for Petty's animation language.
   Every variant answers a state question: "what changed / where should I look?" */
import { stagger, type Variants } from 'motion/react';

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_SPRING: [number, number, number, number] = [0.34, 1.4, 0.44, 1];
export const DUR = { fast: 0.14, base: 0.26, slow: 0.52 } as const;

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_OUT } },
};

export const staggerParent: Variants = {
  hidden: {},
  shown: { transition: { delayChildren: stagger(0.055, { startDelay: 0.05 }) } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  shown: { opacity: 1, x: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};

export const popVerdict: Variants = {
  hidden: { opacity: 0, scale: 0.86 },
  shown: { opacity: 1, scale: 1, transition: { duration: 0.42, ease: EASE_SPRING } },
};
