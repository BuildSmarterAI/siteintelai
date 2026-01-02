import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BillingCycle } from '@/config/subscription-tiers';

interface SubscriptionCheckoutButtonProps {
  tier: string;
  billingCycle: BillingCycle;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function SubscriptionCheckoutButton({
  tier,
  billingCycle,
  children,
  className,
  variant = 'default',
}: SubscriptionCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user || !session) {
      navigate('/auth?redirect=/plans');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          tier,
          billing_cycle: billingCycle,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Failed',
        description: error instanceof Error ? error.message : 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
