import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Zap } from "lucide-react";

interface ArticleCTAProps {
  variant?: "inline" | "full";
}

export function ArticleCTA({ variant = "inline" }: ArticleCTAProps) {
  if (variant === "inline") {
    return (
      <Card className="my-8 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Ready to analyze a site?</h4>
                <p className="text-sm text-muted-foreground">Get instant feasibility data in under 60 seconds.</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/application" className="flex items-center gap-2">
                Run Free QuickCheck™
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="my-12 py-12 px-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/20 mb-6">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          See AI-Powered Feasibility in Action
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Enter any Texas address and get instant insights on zoning, flood zones, utilities, and more. 
          No signup required for your first QuickCheck™.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/application" className="flex items-center gap-2">
              Run Free QuickCheck™
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/sample-report">
              View Sample Report
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
