import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PaymentButton } from "./PaymentButton";
import { Check, Crown } from "lucide-react";
import { format } from "date-fns";

const PRODUCT_TIERS = {
  'prod_TE4lkdrjoRn4ad': {
    name: 'SiteIntel Pro',
    price: '$1,950/month',
    features: [
      '10 Professional Reports per month',
      'Unlimited QuickChecks',
      'Priority Support',
      'API Access'
    ]
  }
};

export const SubscriptionStatus = () => {
  const { subscribed, productId, subscriptionEnd, loading, refreshSubscription } = useSubscription();

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
              {PRODUCT_TIERS['prod_TE4lkdrjoRn4ad'].features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4">
            <PaymentButton type="subscription" size="lg" className="w-full">
              Subscribe for $1,950/month
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
        <Button 
          onClick={refreshSubscription} 
          variant="outline" 
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};
