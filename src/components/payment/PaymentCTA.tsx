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
        className="w-full text-lg h-14 font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {loadingMessage || "Processing..."}
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" strokeWidth={1.5} />
            Purchase Report — <span className="font-mono tabular-nums">${price}</span>
          </>
        )}
      </Button>

      {/* CTA Subline */}
      <p className="text-center text-xs text-muted-foreground tracking-wide">
        Secure checkout • No recurring fees • 30-day guarantee
      </p>


      {/* Application ID (if created) */}
      {applicationId && applicationId !== "pending" && (
        <p className="text-center text-xs text-muted-foreground">
          Application ID: <code className="font-mono text-foreground tabular-nums bg-muted/50 px-1.5 py-0.5 rounded">{applicationId.slice(0, 8)}</code>
        </p>
      )}
    </div>
  );
};
