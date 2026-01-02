export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number | null;
  reportsPerMonth: number;
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
    monthlyPrice: 299,
    annualPrice: 2990,
    reportsPerMonth: 5,
    seats: 1,
    activeParcels: 10,
    features: [
      '5 AI Feasibility Reports / month',
      '10 active parcel limit',
      'Unlimited QuickChecks',
      '90-day report history',
      'Email support',
    ],
    highlight: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    tagline: 'The fastest path to underwriting',
    monthlyPrice: 749,
    annualPrice: 7490,
    reportsPerMonth: 20,
    seats: 2,
    activeParcels: 50,
    features: [
      '20 Lender-Ready Reports / month',
      '50 active parcel limit',
      'Unlimited QuickChecks',
      'Share reports via links',
      '365-day report history',
      'Priority email support',
    ],
    highlight: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    tagline: 'Standardize feasibility org-wide',
    monthlyPrice: 1950,
    annualPrice: 19500,
    reportsPerMonth: 75,
    seats: 5,
    activeParcels: 150,
    features: [
      '75 Lender-Ready Reports / month',
      '5 team seats included',
      '150 active parcel limit',
      'CSV export',
      'Unlimited report history',
      'Priority support',
    ],
    highlight: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Feasibility as infrastructure',
    monthlyPrice: 4500,
    annualPrice: null,
    reportsPerMonth: 250,
    seats: 25,
    activeParcels: -1,
    features: [
      '250+ Reports / month',
      'Unlimited team seats',
      'Full API access',
      'SSO integration',
      'Custom scoring models',
      'Dedicated account manager',
    ],
    highlight: false,
    contactSales: true,
  },
};

export const TIER_ORDER = ['starter', 'professional', 'team', 'enterprise'] as const;

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
  const monthlyTotal = tier.monthlyPrice * 12;
  return Math.round(((monthlyTotal - tier.annualPrice) / monthlyTotal) * 100);
}
