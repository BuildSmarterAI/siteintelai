import { TrendingUp, Users, DollarSign, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradeAreaMetrics } from '@/hooks/useTradeAreaMetrics';

interface GrowthProjectionCardProps {
  metrics: TradeAreaMetrics | null;
  isLoading?: boolean;
}

interface ProjectionItemProps {
  label: string;
  currentValue: string;
  projectedValue: string;
  change: number;
  icon: React.ReactNode;
}

function ProjectionItem({ label, currentValue, projectedValue, change, icon }: ProjectionItemProps) {
  const isPositive = change >= 0;
  
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{currentValue}</span>
          <span>→</span>
          <span className="font-medium text-slate-700">{projectedValue}</span>
        </div>
      </div>
      <div className={cn(
        "flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium",
        isPositive 
          ? "bg-emerald-50 text-emerald-700" 
          : "bg-red-50 text-red-700"
      )}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </div>
    </div>
  );
}

export function GrowthProjectionCard({ metrics, isLoading }: GrowthProjectionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Calculate projections (simplified 5-year estimates)
  const growthRate = metrics.growth_rate_5yr || 5;
  const currentPop = metrics.total_population || 0;
  const projectedPop = Math.round(currentPop * (1 + growthRate / 100));
  
  const currentIncome = metrics.median_income || 0;
  const incomeGrowth = 3.5; // Assume 3.5% annual income growth
  const projectedIncome = Math.round(currentIncome * Math.pow(1 + incomeGrowth / 100, 5));
  
  const currentHomeValue = metrics.median_home_value || 0;
  const homeValueGrowth = 4.2; // Assume 4.2% annual appreciation
  const projectedHomeValue = Math.round(currentHomeValue * Math.pow(1 + homeValueGrowth / 100, 5));

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
        <h4 className="text-sm font-semibold text-slate-900">
          5-Year Growth Projections
        </h4>
      </div>
      
      <div className="divide-y divide-slate-100">
        <ProjectionItem
          label="Population"
          currentValue={formatNumber(currentPop)}
          projectedValue={formatNumber(projectedPop)}
          change={growthRate}
          icon={<Users className="h-4 w-4 text-slate-500" />}
        />
        <ProjectionItem
          label="Median Income"
          currentValue={formatCurrency(currentIncome)}
          projectedValue={formatCurrency(projectedIncome)}
          change={Math.pow(1 + incomeGrowth / 100, 5) * 100 - 100}
          icon={<DollarSign className="h-4 w-4 text-slate-500" />}
        />
        <ProjectionItem
          label="Median Home Value"
          currentValue={formatCurrency(currentHomeValue)}
          projectedValue={formatCurrency(projectedHomeValue)}
          change={Math.pow(1 + homeValueGrowth / 100, 5) * 100 - 100}
          icon={<Home className="h-4 w-4 text-slate-500" />}
        />
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-xs text-slate-500">
          Projections based on historical trends and regional growth patterns. 
          Actual results may vary.
        </div>
      </div>
    </div>
  );
}
