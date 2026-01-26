export type BillingCycle = 'quarterly' | 'annual';

export interface SubscriptionTier {
  id: string;
  name: string;
  tagline: string;
  quarterlyPrice: number; // Per month when billed quarterly
  annualPrice: number; // Total per year
  reportsPerMonth: number | 'unlimited';
  seats: number;
  activeParcels: number;
  features: string[];
  highlight: boolean;
  contactSales?: boolean;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Kill bad deals fast',
    quarterlyPrice: 299,
    annualPrice: 2388, // $199/mo
    reportsPerMonth: 5,
    seats: 1,
    activeParcels: 25,
    features: [
      '5 AI Feasibility Reports / month',
      'PDF download',
      'Dashboard & history',
      '90-day report history',
      'Email support',
    ],
    highlight: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'The fastest path to underwriting',
    quarterlyPrice: 599,
    annualPrice: 4788, // $399/mo
    reportsPerMonth: 15,
    seats: 3,
    activeParcels: 100,
    features: [
      '15 AI Feasibility Reports / month',
      'Everything in Starter',
      'Excel export',
      '3D Design Mode',
      'CAD/DXF export',
      'Priority email support',
    ],
    highlight: true,
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    tagline: 'Feasibility as infrastructure',
    quarterlyPrice: 1499,
    annualPrice: 11988, // $999/mo
    reportsPerMonth: 'unlimited',
    seats: 10,
    activeParcels: -1, // Unlimited
    features: [
      'Unlimited AI Feasibility Reports',
      'Everything in Pro',
      'Full API access',
      'Priority support',
      'Dedicated account manager',
      'Custom integrations',
    ],
    highlight: false,
  },
};

export const TIER_ORDER = ['starter', 'pro', 'unlimited'] as const;

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getAnnualSavings(tier: SubscriptionTier): number {
  if (!tier.annualPrice) return 0;
  const quarterlyTotal = tier.quarterlyPrice * 12;
  return Math.round(((quarterlyTotal - tier.annualPrice) / quarterlyTotal) * 100);
}

// Stripe Price IDs - Launch Pricing (Jan 2026)
export const STRIPE_PRICE_IDS = {
  // One-off Report - $999
  oneOff: 'price_1SthhaAsWVx52wY39LblPmCG',
  
  // Starter - $299/mo quarterly, $199/mo annual
  starter_quarterly: 'price_1SthhcAsWVx52wY3ajY5JMbx',
  starter_annual: 'price_1SthhdAsWVx52wY3YULn3nDG',
  
  // Pro - $599/mo quarterly, $399/mo annual
  pro_quarterly: 'price_1SthheAsWVx52wY3EcOXNDvm',
  pro_annual: 'price_1SthhfAsWVx52wY30XPGK9j8',
  
  // Unlimited - $1,499/mo quarterly, $999/mo annual
  unlimited_quarterly: 'price_1SthhhAsWVx52wY3ePdgZlQJ',
  unlimited_annual: 'price_1SthhiAsWVx52wY3igOj3PcF',
} as const;

// Stripe Product IDs
export const STRIPE_PRODUCT_IDS = {
  oneOff: 'prod_TrQYu3ga4H1Yu4',
  starter_quarterly: 'prod_TrQY3CHqd1m8YY',
  starter_annual: 'prod_TrQY0CbIr1GBVG',
  pro_quarterly: 'prod_TrQYc8GqYPp1WC',
  pro_annual: 'prod_TrQYTguPfHVBDt',
  unlimited_quarterly: 'prod_TrQYnbGLp9ElsH',
  unlimited_annual: 'prod_TrQYErb6UZsqWG',
} as const;
