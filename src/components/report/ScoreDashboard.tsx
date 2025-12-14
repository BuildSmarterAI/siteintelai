import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ScoreRadarChart } from "@/components/report/ScoreRadarChart";
import { DataGauge } from "@/components/report/DataGauge";
import { motion } from "framer-motion";
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
  Radar,
  Sparkles
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
  const [viewMode, setViewMode] = useState<'bars' | 'radar' | 'gauges'>('gauges');
  
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
    if (score >= 80) return "text-[hsl(var(--status-success))]";
    if (score >= 60) return "text-[hsl(var(--status-warning))]";
    if (score >= 40) return "text-[hsl(var(--feasibility-orange))]";
    return "text-[hsl(var(--status-error))]";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-[hsl(var(--status-success))]";
    if (score >= 60) return "bg-[hsl(var(--status-warning))]";
    if (score >= 40) return "bg-[hsl(var(--feasibility-orange))]";
    return "bg-[hsl(var(--status-error))]";
  };

  const getBandColor = (band: string) => {
    switch (band) {
      case 'A': return 'bg-[hsl(var(--status-success))] text-white';
      case 'B': return 'bg-emerald-500 text-white';
      case 'C': return 'bg-[hsl(var(--status-warning))] text-white';
      case 'D': return 'bg-[hsl(var(--feasibility-orange))] text-white';
      case 'F': return 'bg-[hsl(var(--status-error))] text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card 
      id="section-score" 
      className="overflow-hidden border-0 shadow-xl glass-card"
    >
      <CardContent className="p-0">
        {/* Hero Section with Glassmorphism */}
        <div className="relative p-6 md:p-8 bg-gradient-to-br from-[hsl(var(--midnight-blue)/0.03)] via-[hsl(var(--data-cyan)/0.02)] to-[hsl(var(--feasibility-orange)/0.02)]">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--data-cyan)/0.08)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[hsl(var(--feasibility-orange)/0.08)] rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          {/* AI Badge */}
          <motion.div 
            className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--midnight-blue))] text-white text-xs font-mono"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Sparkles className="h-3 w-3 text-[hsl(var(--feasibility-orange))]" />
            AI Analysis
          </motion.div>
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score Circle - Left */}
            <motion.div 
              className="lg:col-span-4 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, hsl(var(--data-cyan) / 0.15) 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                    transform: 'scale(1.2)',
                  }}
                />
                <ScoreCircle score={overallScore} size="xl" showLabel={false} animated={true} />
                <Badge 
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 text-lg font-bold shadow-lg ${getBandColor(scoreBand)}`}
                >
                  Grade {scoreBand}
                </Badge>
              </div>
              <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs font-mono">
                <MapPin className="inline h-3 w-3 mr-1 text-[hsl(var(--data-cyan))]" />
                {address}
              </p>
            </motion.div>

            {/* Category Breakdown - Center */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category Breakdown
                </h3>
                <div className="flex gap-1 p-1 bg-[hsl(var(--midnight-blue)/0.05)] rounded-lg border border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('gauges')}
                    className={cn(
                      "h-7 px-2 gap-1 text-xs",
                      viewMode === 'gauges' && "bg-background shadow-sm"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden sm:inline">Gauges</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('bars')}
                    className={cn(
                      "h-7 px-2 gap-1 text-xs",
                      viewMode === 'bars' && "bg-background shadow-sm"
                    )}
                  >
                    <BarChart3 className="h-3 w-3" />
                    <span className="hidden sm:inline">Bars</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('radar')}
                    className={cn(
                      "h-7 px-2 gap-1 text-xs",
                      viewMode === 'radar' && "bg-background shadow-sm"
                    )}
                  >
                    <Radar className="h-3 w-3" />
                    <span className="hidden sm:inline">Radar</span>
                  </Button>
                </div>
              </div>
              
              {viewMode === 'gauges' && (
                <motion.div 
                  className="grid grid-cols-5 gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <DataGauge
                        value={category.score}
                        label={category.label}
                        size="sm"
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {viewMode === 'bars' && (
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <motion.div 
                      key={category.label} 
                      className="space-y-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className={`p-1 rounded ${category.colorClass} text-white`}>
                            {category.icon}
                          </span>
                          {category.label}
                        </span>
                        <span className={`font-mono font-semibold ${getScoreColor(category.score)}`}>
                          {category.score > 0 ? `${category.score}%` : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${getProgressColor(category.score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${category.score}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {viewMode === 'radar' && (
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
            <div className="lg:col-span-3 space-y-3">
              {/* Opportunities */}
              <motion.div 
                className="p-3 rounded-lg bg-[hsl(var(--status-success)/0.08)] border border-[hsl(var(--status-success)/0.2)] backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--status-success))]" />
                  <span className="text-xs font-semibold text-[hsl(var(--status-success))] font-mono uppercase tracking-wider">
                    {keyOpportunities.length} Opportunities
                  </span>
                </div>
                {keyOpportunities.slice(0, 2).map((opp, i) => (
                  <p key={i} className="text-xs text-[hsl(var(--status-success)/0.8)] line-clamp-1">
                    • {opp}
                  </p>
                ))}
                {keyOpportunities.length > 2 && (
                  <p className="text-[10px] text-[hsl(var(--status-success))] mt-1 font-mono">
                    +{keyOpportunities.length - 2} more
                  </p>
                )}
              </motion.div>

              {/* Risks */}
              <motion.div 
                className="p-3 rounded-lg bg-[hsl(var(--status-error)/0.08)] border border-[hsl(var(--status-error)/0.2)] backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-error))]" />
                  <span className="text-xs font-semibold text-[hsl(var(--status-error))] font-mono uppercase tracking-wider">
                    {keyRisks.length} Risk Factors
                  </span>
                </div>
                {keyRisks.slice(0, 2).map((risk, i) => (
                  <p key={i} className="text-xs text-[hsl(var(--status-error)/0.8)] line-clamp-1">
                    • {risk}
                  </p>
                ))}
                {keyRisks.length > 2 && (
                  <p className="text-[10px] text-[hsl(var(--status-error))] mt-1 font-mono">
                    +{keyRisks.length - 2} more
                  </p>
                )}
              </motion.div>

              {/* Report Date */}
              <p className="text-[10px] text-center text-muted-foreground font-mono uppercase tracking-wider">
                Generated {new Date(createdAt).toLocaleDateString('en-US', {
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
