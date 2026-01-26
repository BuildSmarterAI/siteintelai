/**
 * Centralized entitlement and tier configuration for SiteIntel
 * Source of truth for tier limits - matches Stripe price metadata
 * Updated: 2026-01-26 - Launch Pricing
 */

export const TIER_ENTITLEMENTS: Record<string, {
  included_reports_monthly: number;
  active_parcel_limit: number;
  seat_limit: number;
  history_retention_days: number;
  can_generate_full_report: boolean;
  can_share_links: boolean;
  can_export_csv: boolean;
  can_export_excel: boolean;
  can_export_cad: boolean;
  can_use_api: boolean;
  overage_allowed: boolean;
}> = {
  starter: {
    included_reports_monthly: 5,
    active_parcel_limit: 25,
    seat_limit: 1,
    history_retention_days: 90,
    can_generate_full_report: true,
    can_share_links: false,
    can_export_csv: false,
    can_export_excel: false,
    can_export_cad: false,
    can_use_api: false,
    overage_allowed: false,
  },
  pro: {
    included_reports_monthly: 15,
    active_parcel_limit: 100,
    seat_limit: 3,
    history_retention_days: 365,
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: true,
    can_export_excel: true,
    can_export_cad: true,
    can_use_api: false,
    overage_allowed: true,
  },
  unlimited: {
    included_reports_monthly: 999999,
    active_parcel_limit: 999999,
    seat_limit: 10,
    history_retention_days: 9999,
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: true,
    can_export_excel: true,
    can_export_cad: true,
    can_use_api: true,
    overage_allowed: true,
  },
};

// Map Stripe price IDs to tier names - Launch Pricing (Jan 2026)
export const PRICE_TO_TIER: Record<string, string> = {
  // Starter - $299/mo quarterly, $199/mo annual
  'price_1SthhcAsWVx52wY3ajY5JMbx': 'starter',  // Quarterly
  'price_1SthhdAsWVx52wY3YULn3nDG': 'starter',  // Annual
  // Pro - $599/mo quarterly, $399/mo annual
  'price_1SthheAsWVx52wY3EcOXNDvm': 'pro',      // Quarterly
  'price_1SthhfAsWVx52wY30XPGK9j8': 'pro',      // Annual
  // Unlimited - $1,499/mo quarterly, $999/mo annual
  'price_1SthhhAsWVx52wY3ePdgZlQJ': 'unlimited', // Quarterly
  'price_1SthhiAsWVx52wY3igOj3PcF': 'unlimited', // Annual
  
  // Legacy price IDs (keep for existing subscribers)
  'price_1SkXihAsWVx52wY3Cvrbylf4': 'starter',
  'price_1SkXivAsWVx52wY3fjI3Rd4N': 'starter',
  'price_1SkXj9AsWVx52wY3cwZQSDzC': 'pro',
  'price_1SkXjJAsWVx52wY3sP3suBw5': 'pro',
  'price_1SkXjXAsWVx52wY34Gdq3o2T': 'unlimited',
  'price_1SkXjlAsWVx52wY3q07DyaWp': 'unlimited',
  'price_1SkXkxAsWVx52wY3ZfO3V03r': 'unlimited',
};

// Map Stripe product IDs to tier names
export const PRODUCT_TO_TIER: Record<string, string> = {
  // New Launch Pricing Products
  'prod_TrQY3CHqd1m8YY': 'starter',   // Starter Quarterly
  'prod_TrQY0CbIr1GBVG': 'starter',   // Starter Annual
  'prod_TrQYc8GqYPp1WC': 'pro',       // Pro Quarterly
  'prod_TrQYTguPfHVBDt': 'pro',       // Pro Annual
  'prod_TrQYnbGLp9ElsH': 'unlimited', // Unlimited Quarterly
  'prod_TrQYErb6UZsqWG': 'unlimited', // Unlimited Annual
  
  // Legacy product IDs
  'prod_ThxdnusS5qmyPL': 'starter',
  'prod_ThxeNTJf0WkEMY': 'pro',
  'prod_Thxe2I0rLintQ5': 'unlimited',
  'prod_ThxgIB1k6aP6XC': 'unlimited',
};

// DEPRECATED: Credit packs sunset 2025-01-02
// Keeping for historical reference and webhook processing of existing purchases.
export const CREDIT_PACK_PRICES_DEPRECATED: Record<string, { credits: number; amount_cents: number }> = {
  'price_1SkXm3AsWVx52wY3JUiL1pPF': { credits: 5, amount_cents: 39900 },   // 5 Reports - $399 (RETIRED)
  'price_1SkXnGAsWVx52wY3Uz6wczPE': { credits: 10, amount_cents: 69900 },  // 10 Reports - $699 (RETIRED)
};

// AI Feasibility Report - One-off product - Launch Pricing $999
export const ONE_OFF_PRICE_ID = 'price_1SthhaAsWVx52wY39LblPmCG';
export const ONE_OFF_AMOUNT_CENTS = 99900; // $999

// Legacy one-off price ID (for backwards compatibility)
export const LEGACY_ONE_OFF_PRICE_ID = 'price_1SkXlrAsWVx52wY3RZ1WS6a7';
export const LEGACY_ONE_OFF_AMOUNT_CENTS = 149500; // $1,495
