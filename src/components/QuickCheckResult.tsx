import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreCircle } from "@/components/ScoreCircle";
import { Lock, MapPin, Droplets, Building2, ArrowRight, DollarSign, TrendingUp, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface QuickCheckResultProps {
  score: number;
  band: string;
  floodRisk: string;
  zoningVerdict: string;
  address: string;
  intentType: 'build' | 'buy';
}

export function QuickCheckResult({ score, band, floodRisk, zoningVerdict, address, intentType }: QuickCheckResultProps) {
  const navigate = useNavigate();

  const getBandColor = (band: string) => {
    switch (band) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBandLabel = (band: string) => {
    switch (band) {
      case 'A': return 'Excellent Feasibility';
      case 'B': return 'Good Feasibility';
      case 'C': return 'Moderate Feasibility';
      case 'D': return 'Limited Feasibility';
      case 'F': return 'High Risk';
      default: return 'Unknown';
    }
  };

  return (
    <div className="mt-6 space-y-4 animate-in fade-in-50 duration-500">
      {/* Score Display */}
      <div className="text-center py-6 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border border-primary/20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <ScoreCircle score={score} size="lg" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Badge className={`${getBandColor(band)} text-white text-lg px-4 py-1`}>
            Grade {band}
          </Badge>
          <p className="text-lg font-semibold mt-2">{getBandLabel(band)}</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            {address}
          </p>
        </motion.div>
      </div>

      {/* Quick Insights - Intent-Aware */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {intentType === 'build' ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="zoning-insight">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Zoning Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">{zoningVerdict}</p>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="utility-insight">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  Utility Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">Analyzing proximity...</p>
                <p className="text-xs text-muted-foreground mt-1">Full report shows water/sewer distance</p>
              </CardContent>
            </Card>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="market-value-insight">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Market Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">Investment Grade: {band}</p>
                <p className="text-xs text-muted-foreground mt-1">Full analysis in detailed report</p>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="flood-insurance-insight">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Flood Insurance Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">{floodRisk}</p>
                <p className="text-xs text-muted-foreground mt-1">Critical for ROI calculation</p>
              </CardContent>
            </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Locked Content Preview - Intent-Specific */}
      <div className="relative">
        <div className="blur-sm pointer-events-none opacity-50">
          <Card>
            <CardHeader>
              <CardTitle>
                {intentType === 'build' ? 'Development Timeline & Costs' : 'Investment ROI Analysis'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {intentType === 'build' ? (
                <>
                  <p>Estimated permit timeline: 4-6 months</p>
                  <p>Utility connection cost: $45,000 - $75,000</p>
                  <p>Entitlement risk score: Low</p>
                  <p className="mt-2">Construction-ready site analysis included</p>
                </>
              ) : (
                <>
                  <p>Estimated market value: $1.2M - $1.5M</p>
                  <p>Cap rate potential: 6.5% - 7.8%</p>
                  <p>5-year appreciation forecast: +12.4%</p>
                  <p className="mt-2">Comprehensive investment risk assessment</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="absolute inset-0 flex items-center justify-center unlock-cta">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="shadow-xl"
          >
            <Lock className="mr-2 h-5 w-5" />
            Sign Up to Unlock Full Report
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Additional Locked Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
        <div className="blur-sm pointer-events-none opacity-40">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Utility Infrastructure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Water: 500 ft away</p>
              <p className="text-sm">Sewer: On-site</p>
            </CardContent>
          </Card>
        </div>
        <div className="blur-sm pointer-events-none opacity-40">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Environmental Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">No wetlands detected</p>
              <p className="text-sm">Soil type: Clay loam</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA - Intent-Specific */}
      <Card className={`bg-gradient-to-r ${intentType === 'build' ? 'from-primary/10 via-primary/5' : 'from-accent/10 via-accent/5'} to-transparent border-primary/30`}>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-2">
            {intentType === 'build' 
              ? 'Ready for the Full Feasibility Analysis?' 
              : 'Ready for the Full Investment Report?'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {intentType === 'build'
              ? 'Get a complete lender-ready report with permit timelines, entitlement risk, utility costs, and construction estimates.'
              : 'Get a complete investor-grade report with ROI analysis, market demographics, risk factors, and valuation estimates.'}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
            >
              Create Free Account
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/application?step=2')}
              size="lg"
            >
              {intentType === 'build' ? 'Start Development Analysis' : 'Start Investment Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
