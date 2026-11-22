// Credit packs that users can purchase
export const CREDIT_PACKS = [
  { id: 'starter', label: 'Starter Pack', priceINR: 499, credits: 250 },
  { id: 'growth', label: 'Growth Pack', priceINR: 999, credits: 600 },
  { id: 'pro', label: 'Pro Pack', priceINR: 1999, credits: 1500 },
] as const;

export type CreditPack = (typeof CREDIT_PACKS)[number];