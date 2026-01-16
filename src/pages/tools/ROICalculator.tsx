import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  DollarSign,
  Clock,
  TrendingUp,
  Building2,
} from "lucide-react";

export default function ROICalculator() {
  const [sitesPerYear, setSitesPerYear] = useState(12);
  const [currentCostPerStudy, setCurrentCostPerStudy] = useState(8000);
  const [daysPerStudy, setDaysPerStudy] = useState(14);
  const [hourlyValue, setHourlyValue] = useState(150);

  const calculations = useMemo(() => {
    const siteIntelCost = 795;
    const siteIntelTimeMinutes = 10;

    // Annual costs
    const traditionalAnnualCost = sitesPerYear * currentCostPerStudy;
    const siteIntelAnnualCost = sitesPerYear * siteIntelCost;
    const annualSavings = traditionalAnnualCost - siteIntelAnnualCost;

    // Time savings
    const traditionalHours = sitesPerYear * daysPerStudy * 8; // 8 hours per day
    const siteIntelHours = sitesPerYear * (siteIntelTimeMinutes / 60);
    const hoursSaved = traditionalHours - siteIntelHours;
    const timeSavingsValue = hoursSaved * hourlyValue;

    // Total ROI
    const totalSavings = annualSavings + timeSavingsValue;
    const roiPercentage = ((totalSavings / siteIntelAnnualCost) * 100).toFixed(0);

    // Additional sites you could screen
    const additionalBudget = annualSavings;
    const additionalSites = Math.floor(additionalBudget / siteIntelCost);

    return {
      traditionalAnnualCost,
      siteIntelAnnualCost,
      annualSavings,
      hoursSaved,
      timeSavingsValue,
      totalSavings,
      roiPercentage,
      additionalSites,
    };
  }, [sitesPerYear, currentCostPerStudy, daysPerStudy, hourlyValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <SEOHead
        title="ROI Calculator - Calculate Your Savings"
        description="Calculate how much you can save with SiteIntel AI feasibility reports. Free ROI calculator for developers and investors."
        keywords={["ROI calculator", "feasibility savings", "cost calculator", "development ROI"]}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-medium">Free Tool</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Calculate Your <span className="text-primary">Feasibility Savings</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                See how much time and money you can save by switching from traditional 
                consultants to SiteIntel AI-powered feasibility reports.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Your Current Process
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Sites per year */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Sites analyzed per year</Label>
                          <span className="text-2xl font-bold text-primary">{sitesPerYear}</span>
                        </div>
                        <Slider
                          value={[sitesPerYear]}
                          onValueChange={([value]) => setSitesPerYear(value)}
                          min={1}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>100</span>
                        </div>
                      </div>

                      {/* Current cost per study */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Current cost per feasibility study</Label>
                          <span className="text-2xl font-bold text-foreground">
                            {formatCurrency(currentCostPerStudy)}
                          </span>
                        </div>
                        <Slider
                          value={[currentCostPerStudy]}
                          onValueChange={([value]) => setCurrentCostPerStudy(value)}
                          min={2000}
                          max={20000}
                          step={500}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>$2,000</span>
                          <span>$20,000</span>
                        </div>
                      </div>

                      {/* Days per study */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Average days to receive report</Label>
                          <span className="text-2xl font-bold text-foreground">{daysPerStudy} days</span>
                        </div>
                        <Slider
                          value={[daysPerStudy]}
                          onValueChange={([value]) => setDaysPerStudy(value)}
                          min={3}
                          max={30}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>3 days</span>
                          <span>30 days</span>
                        </div>
                      </div>

                      {/* Hourly value */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Your team's hourly value</Label>
                          <span className="text-2xl font-bold text-foreground">
                            {formatCurrency(hourlyValue)}/hr
                          </span>
                        </div>
                        <Slider
                          value={[hourlyValue]}
                          onValueChange={([value]) => setHourlyValue(value)}
                          min={50}
                          max={500}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>$50/hr</span>
                          <span>$500/hr</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Results */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  {/* Main savings card */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <TrendingUp className="w-5 h-5" />
                        Your Annual Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                        {formatCurrency(calculations.totalSavings)}
                      </div>
                      <div className="text-muted-foreground">
                        {calculations.roiPercentage}% ROI with SiteIntel
                      </div>
                    </CardContent>
                  </Card>

                  {/* Breakdown cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <DollarSign className="w-8 h-8 text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(calculations.annualSavings)}
                        </div>
                        <div className="text-sm text-muted-foreground">Direct cost savings</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <Clock className="w-8 h-8 text-accent mb-2" />
                        <div className="text-2xl font-bold text-foreground">
                          {Math.round(calculations.hoursSaved)} hrs
                        </div>
                        <div className="text-sm text-muted-foreground">Time saved</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <Building2 className="w-8 h-8 text-primary mb-2" />
                        <div className="text-2xl font-bold text-foreground">
                          +{calculations.additionalSites}
                        </div>
                        <div className="text-sm text-muted-foreground">More sites screened</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(calculations.timeSavingsValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">Time value saved</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* CTA */}
                  <Card className="bg-secondary text-secondary-foreground">
                    <CardContent className="pt-6 text-center">
                      <p className="mb-4">
                        Start saving {formatCurrency(calculations.totalSavings)} per year
                      </p>
                      <Button asChild size="lg" variant="default">
                        <Link to="/get-started">
                          Get Your First Report
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Note */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                How We Calculate Your Savings
              </h2>
              <p className="text-muted-foreground mb-6">
                SiteIntel reports cost <strong>$795</strong> and are delivered in{" "}
                <strong>10 minutes</strong>. We compare this to your current process 
                to calculate direct cost savings, time value recovered, and the 
                additional sites you could analyze with your freed-up budget.
              </p>
              <Button asChild variant="outline">
                <Link to="/compare">See Full Comparison</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
