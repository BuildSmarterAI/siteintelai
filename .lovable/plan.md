
# Pricing Update Implementation Plan

## Overview
Complete pricing overhaul to match the new SiteIntel Launch Pricing structure. This involves updating the one-off report price from $1,495 to $999, restructuring subscription tiers from the current 4-tier (Starter/Professional/Team/Enterprise) to a new 3-tier model (Starter/Pro/Unlimited), and changing billing cycles from monthly/annual to quarterly/annual.

---

## New Pricing Structure

### One-Off Report
| Current | New (Launch) |
|---------|--------------|
| $1,495  | $999         |

### Subscription Tiers

| Tier | Quarterly ($/mo) | Annual ($/mo) | Annual Total | Reports/mo |
|------|------------------|---------------|--------------|------------|
| Starter | $299 | $199 | $2,388 | 5 |
| Pro | $599 | $399 | $4,788 | 15 |
| Unlimited | $1,499 | $999 | $11,988 | Unlimited |

### Feature Matrix (New)

| Feature | One-Off | Starter | Pro | Unlimited |
|---------|---------|---------|-----|-----------|
| AI Feasibility Report | Yes | Yes | Yes | Yes |
| PDF Download | Yes | Yes | Yes | Yes |
| Dashboard & History | No | Yes | Yes | Yes |
| Excel Export | No | No | Yes | Yes |
| 3D Design Mode | No | No | Yes | Yes |
| CAD/DXF Export | No | No | Yes | Yes |
| API Access | No | No | No | Yes |
| Priority Support | No | No | No | Yes |

---

## Implementation Tasks

### Phase 1: Frontend Configuration (Central Config)

#### Task 1.1: Update `src/config/subscription-tiers.ts`
- Change `BillingCycle` type from `'monthly' | 'annual'` to `'quarterly' | 'annual'`
- Replace 4-tier structure with 3-tier (Starter/Pro/Unlimited)
- Update prices:
  - Starter: $299/mo quarterly, $2,388/yr
  - Pro: $599/mo quarterly, $4,788/yr
  - Unlimited: $1,499/mo quarterly, $11,988/yr
- Update report limits: 5, 15, unlimited
- Update features per new matrix
- Update `TIER_ORDER` to `['starter', 'pro', 'unlimited']`
- Change savings calculation from 17% to 33%

#### Task 1.2: Update `src/components/subscription/BillingToggle.tsx`
- Change "Monthly" label to "Quarterly"
- Update savings badge from "Save 17%" to "Save 33%"

---

### Phase 2: Frontend Components (Price Display)

#### Task 2.1: Update Default Prices in Components
Files requiring default price updates from 1495 to 999:
- `src/components/payment/PricingSection.tsx` (default prop)
- `src/components/payment/PaymentCTA.tsx` (default prop)
- `src/components/payment/PaymentGate.tsx` (prop values)

#### Task 2.2: Update Hardcoded Price Mentions ($1,495 to $999)
Files with hardcoded "$1,495" strings (~24 files found):
- `src/components/navigation/Header.tsx` - CTA buttons
- `src/pages/Products.tsx` - pricing displays
- `src/pages/About.tsx` - CTA buttons
- `src/pages/Dashboard.tsx` - buy button
- `src/pages/legal/Terms.tsx` - pricing list
- `src/pages/industries/Developers.tsx` - comparison table
- `src/components/application/CandidateParcelList.tsx` - info text
- `src/components/sections/Solution.tsx` - cost comparison
- `src/components/sections/PackagesPricing.tsx` - main price display
- `src/components/sections/BeforeAfterComparison.tsx` - comparison table
- `src/pages/docs/features/FeasibilityReports.tsx` - documentation

#### Task 2.3: Update $999 References (Already correct price)
Files that already show $999 need feature/FAQs updated:
- `src/pages/Pricing.tsx` - FAQs and SEO
- `src/components/sections/KeyAdvantages.tsx` - cost comparison

---

### Phase 3: Subscription Components

#### Task 3.1: Update `src/components/subscription/SubscriptionTierCard.tsx`
- Update billing cycle display logic for quarterly
- Show quarterly billing info instead of monthly

#### Task 3.2: Update `src/components/subscription/FeatureComparisonTable.tsx`
- Change tier columns to match new 3-tier structure
- Update feature values per new matrix
- Remove Team and Enterprise columns
- Add Unlimited column

#### Task 3.3: Update `src/components/SubscriptionStatus.tsx`
- Update `PRODUCT_TIERS` mapping with new tier info
- Change price display to match new structure

#### Task 3.4: Update `src/pages/SubscriptionPricing.tsx`
- Update FAQ about billing (quarterly vs monthly)
- Update any hardcoded tier references

---

### Phase 4: Backend Configuration (Edge Functions)

#### Task 4.1: Update `supabase/functions/_shared/entitlement-constants.ts`
- Update `TIER_ENTITLEMENTS` for new 3-tier structure
- Change report limits: starter=5, pro=15, unlimited=999999
- Update feature flags per new matrix
- Update `ONE_OFF_AMOUNT_CENTS` from 149500 to 99900
- Update `PRICE_TO_TIER` mapping (requires new Stripe prices)
- Update `PRODUCT_TO_TIER` mapping

#### Task 4.2: Update `supabase/functions/create-subscription-checkout/index.ts`
- Update `PRICE_IDS` mapping for new tiers
- Change valid tiers check to `['starter', 'pro', 'unlimited']`
- Update billing cycle handling (quarterly/annual)

#### Task 4.3: Update `supabase/functions/create-checkout-session/index.ts`
- Update price ID references
- Update comments for new $999 price

#### Task 4.4: Update `supabase/functions/stripe-webhook/index.ts`
- Update `ONE_OFF_PRICE_ID` reference
- Update amount checks (99900 instead of 149500)
- Update tier mapping logic

---

### Phase 5: Stripe Product/Price Creation

#### Task 5.1: Create New Stripe Products and Prices
Need to create the following in Stripe:
1. **One-Off Report** - $999 one-time
2. **Starter Quarterly** - $897 every 3 months ($299/mo)
3. **Starter Annual** - $2,388/year ($199/mo)
4. **Pro Quarterly** - $1,797 every 3 months ($599/mo)
5. **Pro Annual** - $4,788/year ($399/mo)
6. **Unlimited Quarterly** - $4,497 every 3 months ($1,499/mo)
7. **Unlimited Annual** - $11,988/year ($999/mo)

#### Task 5.2: Update Edge Functions with New Price IDs
After creating Stripe prices, update all edge functions with new price IDs

---

### Phase 6: Additional Pages & Content

#### Task 6.1: Update Comparison/Marketing Pages
- `src/pages/Compare.tsx` - Update cost comparisons
- `src/pages/FAQ.tsx` - Update pricing FAQs
- `src/pages/InvestorDeck.tsx` - Update revenue stream prices
- `src/pages/docs/FaaSPage.tsx` - Update pricing table

#### Task 6.2: Update Industry Pages
- `src/pages/industries/Developers.tsx`
- `src/pages/industries/Lenders.tsx`
- `src/pages/industries/TexasDevelopers.tsx`

#### Task 6.3: Update Blog/Data Content
- `src/data/blogArticles.ts` - Update price references in articles

---

## File Change Summary

### Frontend Files (18 files)
| File | Changes |
|------|---------|
| `src/config/subscription-tiers.ts` | Complete rewrite - 3 tiers, new prices, quarterly billing |
| `src/components/subscription/BillingToggle.tsx` | Labels: Monthly→Quarterly, 17%→33% |
| `src/components/subscription/SubscriptionTierCard.tsx` | Quarterly billing display |
| `src/components/subscription/FeatureComparisonTable.tsx` | 3-tier columns, new features |
| `src/components/SubscriptionStatus.tsx` | New tier definitions |
| `src/components/payment/PricingSection.tsx` | Default 1495→999 |
| `src/components/payment/PaymentCTA.tsx` | Default 1495→999 |
| `src/components/payment/PaymentGate.tsx` | Price props |
| `src/components/navigation/Header.tsx` | CTA text $1,495→$999 |
| `src/pages/Pricing.tsx` | Already $999, update FAQs |
| `src/pages/Products.tsx` | $1,495→$999 |
| `src/pages/SubscriptionPricing.tsx` | FAQ updates |
| `src/pages/Compare.tsx` | Cost comparisons |
| `src/pages/FAQ.tsx` | Pricing FAQs |
| `src/pages/legal/Terms.tsx` | Pricing list |
| `src/pages/About.tsx` | CTA buttons |
| `src/pages/Dashboard.tsx` | Buy button |
| Plus ~6 more section/industry files |

### Backend Files (4 files)
| File | Changes |
|------|---------|
| `supabase/functions/_shared/entitlement-constants.ts` | New tier config, $99900 |
| `supabase/functions/create-subscription-checkout/index.ts` | New price IDs, tiers |
| `supabase/functions/create-checkout-session/index.ts` | New price ID |
| `supabase/functions/stripe-webhook/index.ts` | Amount checks, tier mapping |

---

## Technical Notes

### Stripe Price Creation Required
Before deploying, need to create new Stripe products/prices:
1. Use Stripe MCP tools to create products and prices
2. Capture price IDs
3. Update edge functions with new IDs

### Billing Cycle Change
The switch from monthly to quarterly billing requires:
- Updating all UI labels
- Changing Stripe recurring interval from `month` to `quarter` (3 months)
- Updating billing calculations in components

### Launch Pricing Badge
Consider adding "Launch Pricing" badge with "Ends April 1, 2026" messaging to:
- Pricing page hero
- Subscription tier cards
- One-off report checkout

### Backward Compatibility
- Keep old price IDs in webhook for existing subscribers
- Don't break existing subscription processing
- Add new price IDs alongside old ones initially

---

## Estimated Scope
- **Frontend files modified:** ~24
- **Backend files modified:** 4
- **Stripe products to create:** 7 prices
- **Total scope:** Medium-Large
