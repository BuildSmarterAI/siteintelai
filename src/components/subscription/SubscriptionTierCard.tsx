import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionTier, BillingCycle, formatPrice, getAnnualSavings } from '@/config/subscription-tiers';
import { SubscriptionCheckoutButton } from './SubscriptionCheckoutButton';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
}

export function SubscriptionTierCard({ tier, billingCycle }: SubscriptionTierCardProps) {
  const { subscribed, productId } = useSubscription();
  
  // Check if this tier is the user's current plan
  const isCurrentPlan = subscribed && productId?.toLowerCase().includes(tier.id.toLowerCase());
  
  const price = billingCycle === 'annual' && tier.annualPrice 
    ? tier.annualPrice / 12 
    : tier.quarterlyPrice;
  
  const totalPrice = billingCycle === 'annual' && tier.annualPrice
    ? tier.annualPrice
    : tier.quarterlyPrice * 3; // Quarterly billing = 3 months

  const savings = getAnnualSavings(tier);

  return (
    <Card 
      className={cn(
        'relative flex flex-col transition-all duration-300 hover:shadow-xl',
        tier.highlight && 'border-primary border-2 shadow-lg scale-[1.02]',
        isCurrentPlan && 'ring-2 ring-green-500 border-green-500'
      )}
    >
      {tier.highlight && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
          Most Popular
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge className="absolute -top-3 right-4 bg-green-500 text-white px-4 py-1">
          Your Plan
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <CardDescription className="text-sm">{tier.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="text-center">
          {tier.contactSales ? (
            <div className="text-3xl font-bold text-foreground">Custom</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground">{formatPrice(price)}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              {billingCycle === 'annual' && tier.annualPrice && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatPrice(totalPrice)} billed annually
                  {savings > 0 && (
                    <span className="ml-2 text-green-600 font-medium">Save {savings}%</span>
                  )}
                </div>
              )}
              {billingCycle === 'quarterly' && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatPrice(totalPrice)} billed quarterly
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-4 border-y">
          <div>
            <div className="text-2xl font-bold text-primary">
              {tier.reportsPerMonth === 'unlimited' ? '∞' : tier.reportsPerMonth}
            </div>
            <div className="text-xs text-muted-foreground">Reports/mo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{tier.seats}</div>
            <div className="text-xs text-muted-foreground">Seats</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {tier.activeParcels === -1 ? '∞' : tier.activeParcels}
            </div>
            <div className="text-xs text-muted-foreground">Parcels</div>
          </div>
        </div>

        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-6">
        {isCurrentPlan ? (
          <Button className="w-full" variant="outline" disabled>
            Current Plan
          </Button>
        ) : tier.contactSales ? (
          <Button className="w-full" variant="outline" asChild>
            <a href="/contact?subject=Enterprise">Contact Sales</a>
          </Button>
        ) : (
          <SubscriptionCheckoutButton
            tier={tier.id}
            billingCycle={billingCycle}
            className={cn(
              'w-full',
              tier.highlight && 'bg-primary hover:bg-primary/90'
            )}
            variant={tier.highlight ? 'default' : 'outline'}
          >
            Get Started
          </SubscriptionCheckoutButton>
        )}
      </CardFooter>
    </Card>
  );
}
