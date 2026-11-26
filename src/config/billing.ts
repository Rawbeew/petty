/* Petty — billing configuration. Flat HOUSEHOLD plan ($9/mo · $79/yr, 6 seats).
 * No account system exists; entitlement is self-reported on-device (honor system).
 * Pretending otherwise would require servers, tracking and accounts — the three
 * things Petty is designed without. Setup: README § Billing. */
import { safeGet, safeSet } from '../lib/safeStorage';

export const BILLING = {
  planName: 'The Household',
  monthlyLink: '',   /* paste https://buy.stripe.com/… for $9/mo (household-monthly price) */
  annualLink: '',    /* paste https://buy.stripe.com/… for $79/yr (household-annual price) */
  portalLink: '',    /* paste Stripe Customer Portal login URL — one-tap manage/cancel */
  monthlyPrice: '$9', annualPrice: '$79', seats: 6,
};

export const isBillingConfigured = (): boolean =>
  BILLING.monthlyLink.startsWith('https://buy.stripe.com/') && BILLING.annualLink.startsWith('https://buy.stripe.com/');

export type Plan = 'free' | 'household';
export const getPlan = (): Plan => (safeGet('petty.plan') === 'household' ? 'household' : 'free');
export const setPlan = (p: Plan): void => { safeSet('petty.plan', p); };

/* What the plan actually gates — kept deliberately small and honest:
   free = everything except the manual Clockwatch cap. Statute-clock imports
   (deposit packet / complaint desk) are NEVER capped — the law doesn't wait for billing. */
export const CLOCKWATCH_FREE_CAP = 5;
export const clockwatchCapHit = (activeCount: number): boolean => getPlan() === 'free' && activeCount >= CLOCKWATCH_FREE_CAP;
