import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreCircle } from "@/components/ScoreCircle";
import { Lock, MapPin, Droplets, Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickCheckResultProps {
  score: number;
  band: string;
  floodRisk: string;
  zoningVerdict: string;
  address: string;
}

export function QuickCheckResult({ score, band, floodRisk, zoningVerdict, address }: QuickCheckResultProps) {
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
        <ScoreCircle score={score} size="lg" />
        <div className="mt-4">
          <Badge className={`${getBandColor(band)} text-white text-lg px-4 py-1`}>
            Grade {band}
          </Badge>
          <p className="text-lg font-semibold mt-2">{getBandLabel(band)}</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            {address}
          </p>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Flood Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{floodRisk}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              Zoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{zoningVerdict}</p>
          </CardContent>
        </Card>
      </div>

      {/* Locked Content Preview */}
      <div className="relative">
        <div className="blur-sm pointer-events-none opacity-50">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Population within 3 miles: 45,234 residents</p>
              <p>Median income: $72,500</p>
              <p>5-year growth rate: +12.4%</p>
              <p className="mt-2">Traffic (AADT): 32,500 vehicles/day</p>
            </CardContent>
          </Card>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
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

      {/* Final CTA */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-2">Ready for the Full Analysis?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get a complete lender-ready feasibility report with 20+ data sources, AI-powered insights, and citations for every fact.
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
              Start Full Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
