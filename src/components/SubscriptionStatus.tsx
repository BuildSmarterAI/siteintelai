import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PaymentButton } from "./PaymentButton";
import { Check, Crown } from "lucide-react";
import { format } from "date-fns";

const PRODUCT_TIERS: Record<string, {
  name: string;
  price: string;
  features: string[];
}> = {
  // New Launch Pricing Tiers
  'prod_TrQY3CHqd1m8YY': {
    name: 'Starter (Quarterly)',
    price: '$299/month',
    features: [
      '5 AI Feasibility Reports per month',
      'PDF download',
      'Dashboard & history',
    ]
  },
  'prod_TrQY0CbIr1GBVG': {
    name: 'Starter (Annual)',
    price: '$199/month',
    features: [
      '5 AI Feasibility Reports per month',
      'PDF download',
      'Dashboard & history',
    ]
  },
  'prod_TrQYc8GqYPp1WC': {
    name: 'Pro (Quarterly)',
    price: '$599/month',
    features: [
      '15 AI Feasibility Reports per month',
      'Excel export',
      '3D Design Mode',
      'CAD/DXF export',
    ]
  },
  'prod_TrQYTguPfHVBDt': {
    name: 'Pro (Annual)',
    price: '$399/month',
    features: [
      '15 AI Feasibility Reports per month',
      'Excel export',
      '3D Design Mode',
      'CAD/DXF export',
    ]
  },
  'prod_TrQYnbGLp9ElsH': {
    name: 'Unlimited (Quarterly)',
    price: '$1,499/month',
    features: [
      'Unlimited AI Feasibility Reports',
      'Full API access',
      'Priority support',
      'Dedicated account manager',
    ]
  },
  'prod_TrQYErb6UZsqWG': {
    name: 'Unlimited (Annual)',
    price: '$999/month',
    features: [
      'Unlimited AI Feasibility Reports',
      'Full API access',
      'Priority support',
      'Dedicated account manager',
    ]
  },
};

export const SubscriptionStatus = () => {
  const { subscribed, productId, subscriptionEnd, loading, refreshSubscription, openCustomerPortal, credits } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-maxx-red" />
            Upgrade to Pro
          </CardTitle>
          <CardDescription>Get unlimited access to all features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">SiteIntel Pro includes:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">15 AI Feasibility Reports per month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Excel & CAD/DXF export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">3D Design Mode</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Priority support</span>
              </li>
            </ul>
          </div>
          <div className="pt-4">
            <PaymentButton type="subscription" size="lg" className="w-full">
              Subscribe from $399/month
            </PaymentButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = productId ? PRODUCT_TIERS[productId as keyof typeof PRODUCT_TIERS] : null;

  return (
    <Card className="border-maxx-red">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-maxx-red" />
          {tierInfo?.name || 'Active Subscription'}
          <Badge variant="default" className="ml-auto">Active</Badge>
        </CardTitle>
        <CardDescription>
          Your subscription is active
          {subscriptionEnd && ` until ${format(new Date(subscriptionEnd), 'MMMM d, yyyy')}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credits && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Reports used this month</span>
              <span className="font-medium">{credits.reports_used} / {credits.reports_limit}</span>
            </div>
          </div>
        )}
        {tierInfo && (
          <div className="space-y-2">
            <h4 className="font-semibold">Your benefits:</h4>
            <ul className="space-y-2">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-2">
          <Button 
            onClick={openCustomerPortal} 
            variant="default" 
            className="flex-1"
          >
            Manage Subscription
          </Button>
          <Button 
            onClick={refreshSubscription} 
            variant="outline" 
            size="icon"
          >
            ↻
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
