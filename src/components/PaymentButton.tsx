import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PaymentButtonProps {
  type: 'report' | 'subscription';
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export const PaymentButton = ({ type, children, className, variant = "default", size = "default" }: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error("Please log in to continue");
        return;
      }

      const functionName = type === 'report' ? 'create-checkout-session' : 'create-subscription';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast.error("Failed to create checkout session");
        return;
      }

      if (data?.url) {
        // Open in new tab
        window.open(data.url, '_blank');
        toast.success("Checkout opened in new tab");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
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
};
