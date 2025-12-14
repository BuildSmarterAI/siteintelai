import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ScoreRadarChart } from "@/components/report/ScoreRadarChart";
import { 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Droplets, 
  Zap, 
  Car,
  Building2,
  Leaf,
  BarChart3,
  Radar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryScore {
  label: string;
  score: number;
  icon: React.ReactNode;
  colorClass: string;
}

interface ScoreDashboardProps {
  overallScore: number;
  scoreBand: string;
  address: string;
  zoningScore?: number;
  floodScore?: number;
  utilitiesScore?: number;
  trafficScore?: number;
  environmentalScore?: number;
  keyOpportunities?: string[];
  keyRisks?: string[];
  createdAt: string;
}

export function ScoreDashboard({
  overallScore,
  scoreBand,
  address,
  zoningScore = 0,
  floodScore = 0,
  utilitiesScore = 0,
  trafficScore = 0,
  environmentalScore = 0,
  keyOpportunities = [],
  keyRisks = [],
  createdAt,
}: ScoreDashboardProps) {
  const [viewMode, setViewMode] = useState<'bars' | 'radar'>('bars');
  
  const categories: CategoryScore[] = [
    { 
      label: "Zoning", 
      score: zoningScore, 
      icon: <Building2 className="h-4 w-4" />,
      colorClass: "bg-blue-500"
    },
    { 
      label: "Flood Risk", 
      score: floodScore, 
      icon: <Droplets className="h-4 w-4" />,
      colorClass: "bg-cyan-500"
    },
    { 
      label: "Utilities", 
      score: utilitiesScore, 
      icon: <Zap className="h-4 w-4" />,
      colorClass: "bg-amber-500"
    },
    { 
      label: "Traffic", 
      score: trafficScore, 
      icon: <Car className="h-4 w-4" />,
      colorClass: "bg-purple-500"
    },
    { 
      label: "Environmental", 
      score: environmentalScore, 
      icon: <Leaf className="h-4 w-4" />,
      colorClass: "bg-green-500"
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getBandColor = (band: string) => {
    switch (band) {
      case 'A': return 'bg-green-600 text-white';
      case 'B': return 'bg-emerald-500 text-white';
      case 'C': return 'bg-amber-500 text-white';
      case 'D': return 'bg-orange-500 text-white';
      case 'F': return 'bg-red-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card id="section-score" className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/30">
      <CardContent className="p-0">
        {/* Hero Section */}
        <div className="relative p-6 md:p-8 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score Circle - Left */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="relative">
                <ScoreCircle score={overallScore} size="xl" showLabel={false} animated={true} />
                <Badge 
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 text-lg font-bold ${getBandColor(scoreBand)}`}
                >
                  Grade {scoreBand}
                </Badge>
              </div>
              <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs">
                <MapPin className="inline h-3 w-3 mr-1" />
                {address}
              </p>
            </div>

            {/* Category Breakdown - Center */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Category Breakdown
                </h3>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('bars')}
                    className={cn(
                      "h-7 px-2 gap-1",
                      viewMode === 'bars' && "bg-background shadow-sm"
                    )}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Bars</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('radar')}
                    className={cn(
                      "h-7 px-2 gap-1",
                      viewMode === 'radar' && "bg-background shadow-sm"
                    )}
                  >
                    <Radar className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Radar</span>
                  </Button>
                </div>
              </div>
              
              {viewMode === 'bars' ? (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className={`p-1 rounded ${category.colorClass} text-white`}>
                            {category.icon}
                          </span>
                          {category.label}
                        </span>
                        <span className={`font-semibold ${getScoreColor(category.score)}`}>
                          {category.score > 0 ? `${category.score}%` : '—'}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${getProgressColor(category.score)}`}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ScoreRadarChart
                  zoningScore={zoningScore}
                  floodScore={floodScore}
                  utilitiesScore={utilitiesScore}
                  trafficScore={trafficScore}
                  environmentalScore={environmentalScore}
                />
              )}
            </div>

            {/* Quick Stats - Right */}
            <div className="lg:col-span-3 space-y-4">
              {/* Opportunities */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {keyOpportunities.length} Opportunities
                  </span>
                </div>
                {keyOpportunities.slice(0, 2).map((opp, i) => (
                  <p key={i} className="text-xs text-green-700/80 line-clamp-1">
                    • {opp}
                  </p>
                ))}
                {keyOpportunities.length > 2 && (
                  <p className="text-xs text-green-600 mt-1">
                    +{keyOpportunities.length - 2} more
                  </p>
                )}
              </div>

              {/* Risks */}
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">
                    {keyRisks.length} Risk Factors
                  </span>
                </div>
                {keyRisks.slice(0, 2).map((risk, i) => (
                  <p key={i} className="text-xs text-red-700/80 line-clamp-1">
                    • {risk}
                  </p>
                ))}
                {keyRisks.length > 2 && (
                  <p className="text-xs text-red-600 mt-1">
                    +{keyRisks.length - 2} more
                  </p>
                )}
              </div>

              {/* Report Date */}
              <p className="text-xs text-center text-muted-foreground">
                Report generated {new Date(createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
