import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  MapPin, 
  Shield, 
  CheckCircle2, 
  FileText,
  Zap,
  Building2,
  Lock
} from "lucide-react";

interface PaymentGateProps {
  applicationId: string;
  propertyAddress: string;
  coordinates?: { lat: number; lng: number };
  onEmailProvided?: (email: string) => void;
  onPaymentInitiated?: () => void;
}

export const PaymentGate = ({ 
  applicationId, 
  propertyAddress, 
  coordinates,
  onEmailProvided,
  onPaymentInitiated 
}: PaymentGateProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePayment = async () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");

    // Notify parent that email was provided (for late application creation)
    onEmailProvided?.(email);

    try {
      setLoading(true);

      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          application_id: applicationId,
          email: session?.user?.email || email,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });

      if (error) {
        console.error("Payment error:", error);
        toast.error("Failed to create checkout session");
        return;
      }

      if (data?.url) {
        onPaymentInitiated?.();
        // Open Stripe checkout in new tab
        window.open(data.url, "_blank");
        toast.success("Checkout opened in new tab");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Site Feasibility Intelligence™
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Complete AI-powered feasibility analysis for your property
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Property Preview */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">{propertyAddress}</p>
                {coordinates && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Report Features */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Building2, label: "Zoning & Buildability" },
              { icon: Shield, label: "Flood & Environmental" },
              { icon: Zap, label: "Utilities Analysis" },
              { icon: CheckCircle2, label: "Market Demographics" },
            ].map(({ icon: Icon, label }) => (
              <div 
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="text-center py-4 border-y border-border/50">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-foreground">$999</span>
              <span className="text-muted-foreground">one-time</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Delivered in under 10 minutes
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={emailError ? "border-destructive" : ""}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              You'll create your account after payment to access your report
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            size="lg"
            className="w-full text-lg h-14"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Purchase Report — $999
              </>
            )}
          </Button>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {["FEMA", "ArcGIS", "TxDOT", "EPA"].map((source) => (
              <Badge key={source} variant="secondary" className="text-xs">
                {source} Verified
              </Badge>
            ))}
          </div>

          {/* Guarantee */}
          <p className="text-center text-xs text-muted-foreground">
            <Shield className="inline h-3 w-3 mr-1" />
            Secure payment powered by Stripe. 30-day money-back guarantee.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
