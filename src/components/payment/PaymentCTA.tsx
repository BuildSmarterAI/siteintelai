import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield } from "lucide-react";

interface PaymentCTAProps {
  loading: boolean;
  loadingMessage?: string;
  onClick: () => void;
  price?: number;
  applicationId?: string;
}

export const PaymentCTA = ({
  loading,
  loadingMessage,
  onClick,
  price = 999,
  applicationId,
}: PaymentCTAProps) => {
  return (
    <div className="space-y-3">
      <Button
        onClick={onClick}
        disabled={loading}
        size="lg"
        className="w-full text-lg h-14"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {loadingMessage || "Processing..."}
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Purchase Report — ${price}
          </>
        )}
      </Button>

      {/* CTA Subline */}
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout • No recurring fees • 30-day guarantee
      </p>

      {/* Guarantee */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary/5 border border-primary/10">
        <Shield className="h-4 w-4 text-primary" />
        <p className="text-xs text-foreground">
          <span className="font-medium">30-day money-back guarantee</span>
          <span className="text-muted-foreground"> — Secure payment via Stripe</span>
        </p>
      </div>

      {/* Application ID (if created) */}
      {applicationId && applicationId !== "pending" && (
        <p className="text-center text-xs text-muted-foreground">
          Application ID: <code className="font-mono">{applicationId.slice(0, 8)}</code>
        </p>
      )}
    </div>
  );
};
