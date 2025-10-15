import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuickCheckResult } from "./QuickCheckResult";
import { FadeIn } from "@/components/ui/fade-in";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickCheckData {
  score: number;
  band: string;
  floodRisk: string;
  zoningVerdict: string;
  address: string;
}

export function QuickCheckWidget() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickCheckData, setQuickCheckData] = useState<QuickCheckData | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleQuickCheck = async () => {
    if (!address) {
      toast.error("Please enter a property address");
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-quick-check', {
        body: { address }
      });

      if (error) throw error;

      setQuickCheckData({
        score: data.score,
        band: data.band,
        floodRisk: data.floodRisk,
        zoningVerdict: data.zoningVerdict,
        address: address
      });

      setTimeout(() => setShowResults(true), 150);
      toast.success("QuickCheck™ complete!");
    } catch (error) {
      console.error('QuickCheck error:', error);
      toast.error("Unable to generate QuickCheck. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (selectedAddress: string, placeDetails: any) => {
    setAddress(selectedAddress);
    setQuickCheckData(null);
    setShowResults(false);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-6 md:mt-8 backdrop-blur-xl bg-card/90 border-primary/20 shadow-xl">
      <CardHeader className="px-6 py-4 md:px-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl">
          <Zap className="text-primary h-5 md:h-6 w-5 md:w-6" />
          Get Your Instant Feasibility Score
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Enter any Texas commercial property address — no login required
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 md:px-6">
        <AddressAutocomplete
          value={address}
          onChange={handleAddressSelect}
          placeholder="123 Main St, Houston, TX"
          className="text-base md:text-lg min-h-[48px]"
        />
        <Button
          variant="maxx-red"
          size="lg"
          className="w-full min-h-[48px] md:min-h-[44px] text-base md:text-lg"
          onClick={handleQuickCheck}
          disabled={isLoading || !address}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 md:h-5 w-4 md:w-5 animate-spin" />
              Analyzing Property...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 md:h-5 w-4 md:w-5" />
              Run QuickCheck™ (Free)
            </>
          )}
        </Button>

        {isLoading && (
          <div className="space-y-4" aria-busy="true" role="status" aria-label="Loading property analysis">
            <div className="py-6 space-y-3">
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </div>
        )}

        <FadeIn show={showResults && !isLoading && quickCheckData !== null}>
          <QuickCheckResult
            score={quickCheckData?.score || 0}
            band={quickCheckData?.band || 'C'}
            floodRisk={quickCheckData?.floodRisk || ''}
            zoningVerdict={quickCheckData?.zoningVerdict || ''}
            address={quickCheckData?.address || ''}
          />
        </FadeIn>
      </CardContent>
    </Card>
  );
}
