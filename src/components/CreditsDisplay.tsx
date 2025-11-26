import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Zap, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditsData {
  tier: string;
  reports_limit: number;
  reports_used: number;
  reports_remaining: number;
  purchased_credits?: number;
  quickchecks_unlimited: boolean;
  quickchecks_used: number;
  has_subscription: boolean;
  period_end?: string;
}

export const CreditsDisplay = () => {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-credits", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }

      setCredits(data);
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();

    // Refresh every minute
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!credits?.has_subscription) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Free Tier</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Upgrade to Pro to generate unlimited reports
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressValue = credits.reports_limit > 0 
    ? ((credits.reports_limit - credits.reports_remaining) / credits.reports_limit) * 100 
    : 0;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">{credits.tier}</span>
          </div>
          {credits.period_end && (
            <span className="text-xs text-muted-foreground">
              Renews {new Date(credits.period_end).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Reports</span>
            </div>
            <span className="font-medium">
              {credits.reports_remaining} available
              {credits.purchased_credits && credits.purchased_credits > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({credits.purchased_credits} purchased)
                </span>
              )}
            </span>
          </div>
          {credits.reports_limit > 0 && (
            <Progress value={100 - progressValue} className="h-2" />
          )}
        </div>

        {credits.quickchecks_unlimited && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            <span>Unlimited QuickChecks</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
