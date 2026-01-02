/**
 * Centralized entitlement and tier configuration for SiteIntel
 * Source of truth for tier limits - matches Stripe price metadata
 * Updated: 2025-01-02
 */

export const TIER_ENTITLEMENTS: Record<string, {
  included_reports_monthly: number;
  active_parcel_limit: number;
  seat_limit: number;
  history_retention_days: number;
  can_generate_full_report: boolean; // Renamed from can_generate_lender_ready
  can_share_links: boolean;
  can_export_csv: boolean;
  can_use_api: boolean;
  overage_allowed: boolean;
}> = {
  starter: {
    included_reports_monthly: 5,
    active_parcel_limit: 10,
    seat_limit: 1,
    history_retention_days: 90,
    can_generate_full_report: false,
    can_share_links: false,
    can_export_csv: false,
    can_use_api: false,
    overage_allowed: false,
  },
  professional: {
    included_reports_monthly: 20,
    active_parcel_limit: 50,
    seat_limit: 2,
    history_retention_days: 365,
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: false,
    can_use_api: false,
    overage_allowed: true,
  },
  team: {
    included_reports_monthly: 75,
    active_parcel_limit: 150,
    seat_limit: 5,
    history_retention_days: 9999,
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: true,
    can_use_api: false,
    overage_allowed: true,
  },
  enterprise: {
    included_reports_monthly: 250,
    active_parcel_limit: 999999,
    seat_limit: 10,
    history_retention_days: 9999,
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: true,
    can_use_api: true,
    overage_allowed: true,
  },
};

// Map Stripe price IDs to tier names
export const PRICE_TO_TIER: Record<string, string> = {
  // Starter - $299/mo, $2,990/yr
  'price_1SkXihAsWVx52wY3Cvrbylf4': 'starter',  // Monthly
  'price_1SkXivAsWVx52wY3fjI3Rd4N': 'starter',  // Annual
  // Professional - $749/mo, $7,490/yr
  'price_1SkXj9AsWVx52wY3cwZQSDzC': 'professional',
  'price_1SkXjJAsWVx52wY3sP3suBw5': 'professional',
  // Team - $1,950/mo, $19,500/yr
  'price_1SkXjXAsWVx52wY34Gdq3o2T': 'team',
  'price_1SkXjlAsWVx52wY3q07DyaWp': 'team',
  // Enterprise - $4,500/mo (custom)
  'price_1SkXkxAsWVx52wY3ZfO3V03r': 'enterprise',
};

// Map Stripe product IDs to tier names (fallback)
export const PRODUCT_TO_TIER: Record<string, string> = {
  'prod_ThxdnusS5qmyPL': 'starter',
  'prod_ThxeNTJf0WkEMY': 'professional',
  'prod_Thxe2I0rLintQ5': 'team',
  'prod_ThxgIB1k6aP6XC': 'enterprise',
};

// DEPRECATED: Credit packs sunset 2025-01-02
// Credit packs undermine $1,495 anchor pricing and have been retired.
// Keeping for historical reference and webhook processing of existing purchases.
export const CREDIT_PACK_PRICES_DEPRECATED: Record<string, { credits: number; amount_cents: number }> = {
  'price_1SkXm3AsWVx52wY3JUiL1pPF': { credits: 5, amount_cents: 39900 },   // 5 Reports - $399 (RETIRED)
  'price_1SkXnGAsWVx52wY3Uz6wczPE': { credits: 10, amount_cents: 69900 },  // 10 Reports - $699 (RETIRED)
};

// Development Feasibility Report - One-off product (renamed from Lender-Ready Report)
export const ONE_OFF_PRICE_ID = 'price_1SkXlrAsWVx52wY3RZ1WS6a7';
export const ONE_OFF_AMOUNT_CENTS = 149500; // $1,495
