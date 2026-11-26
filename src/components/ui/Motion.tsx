/* Motion primitives — reduced-motion is a hard gate, not an afterthought. */
import { m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeRise, staggerParent, listItem, popVerdict } from '../../lib/motion';

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div className={className}
      initial={reduce ? false : 'hidden'} whileInView="shown" viewport={{ once: true, margin: '-40px' }}
      variants={fadeRise} transition={{ delay }}>
      {children}
    </m.div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.ul className={className}
      initial={reduce ? false : 'hidden'} animate="shown" variants={staggerParent}>
      {children}
    </m.ul>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <m.li className={className} variants={listItem}>{children}</m.li>;
}

export function PopVerdict({ children, className, ariaLive }: { children: ReactNode; className?: string; ariaLive?: 'polite' | 'assertive' }) {
  const reduce = useReducedMotion();
  return (
    <m.div className={className} aria-live={ariaLive}
      initial={reduce ? false : 'hidden'} animate="shown" variants={popVerdict}>
      {children}
    </m.div>
  );
}
