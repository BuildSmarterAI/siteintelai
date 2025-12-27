import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText } from "lucide-react";

import { AddressLockBadge } from "./AddressLockBadge";
import { PricingSection } from "./PricingSection";
import { FeaturesOutcomes } from "./FeaturesOutcomes";
import { EmailInputSection } from "./EmailInputSection";
import { TrustBadges } from "./TrustBadges";
import { PaymentCTA } from "./PaymentCTA";
import { TimelinePreview } from "./TimelinePreview";

interface PaymentGateProps {
  applicationId: string;
  propertyAddress: string;
  coordinates?: { lat: number; lng: number };
  onEmailProvided?: (email: string) => void;
  onPaymentInitiated?: () => void;
  onChangeAddress?: () => void;
}

export const PaymentGate = ({ 
  applicationId, 
  propertyAddress, 
  coordinates,
  onEmailProvided,
  onPaymentInitiated,
  onChangeAddress,
}: PaymentGateProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | undefined>();

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setIsAuthenticated(true);
        setAuthenticatedEmail(session.user.email);
        setEmail(session.user.email);
      }
    };
    checkAuth();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePayment = async () => {
    const effectiveEmail = authenticatedEmail || email;

    if (!effectiveEmail) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(effectiveEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");

    // Notify parent that email was provided (for late application creation)
    if (!isAuthenticated) {
      onEmailProvided?.(effectiveEmail);
    }

    try {
      setLoading(true);
      setLoadingMessage("Creating checkout session...");

      const { data: { session } } = await supabase.auth.getSession();

      setLoadingMessage("Redirecting to Stripe for secure payment...");

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          application_id: applicationId,
          email: session?.user?.email || effectiveEmail,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });

      if (error) {
        console.error("Payment error:", error);
        toast.error("Failed to create checkout session. Please try again.");
        return;
      }

      if (data?.url) {
        onPaymentInitiated?.();
        window.open(data.url, "_blank");
        toast.success("Checkout opened in new tab");
      } else {
        toast.error("Could not create checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Connection issue. Please check your internet and try again.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl rounded-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <CardTitle className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
            Site Feasibility Intelligence™
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Complete AI-powered feasibility analysis for your property
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Address Lock Badge */}
          <AddressLockBadge
            propertyAddress={propertyAddress}
            coordinates={coordinates}
            onChangeAddress={onChangeAddress}
          />

          {/* What You'll Receive */}
          <FeaturesOutcomes />

          {/* Pricing */}
          <PricingSection price={999} />

          {/* Email Input */}
          <EmailInputSection
            email={email}
            onEmailChange={setEmail}
            emailError={emailError}
            onClearError={() => setEmailError("")}
            isAuthenticated={isAuthenticated}
            authenticatedEmail={authenticatedEmail}
          />

          {/* What Happens Next */}
          <TimelinePreview />

          {/* CTA + Guarantee */}
          <PaymentCTA
            loading={loading}
            loadingMessage={loadingMessage}
            onClick={handlePayment}
            price={999}
            applicationId={applicationId}
          />

          {/* Trust Badges */}
          <TrustBadges />
        </CardContent>
      </Card>
    </div>
  );
};
