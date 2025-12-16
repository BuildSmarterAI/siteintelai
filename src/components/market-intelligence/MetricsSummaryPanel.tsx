import { cn } from '@/lib/utils';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Briefcase, 
  Building2,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import type { TradeAreaMetrics } from '@/hooks/useTradeAreaMetrics';

interface MetricsSummaryPanelProps {
  metrics: TradeAreaMetrics | null;
  radiusMiles?: number;
  isLoading?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

function MetricCard({ label, value, icon, trend, trendValue, className }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className={cn(
      "bg-white rounded-xl p-4 shadow-sm border border-slate-100",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        {trend && trendValue && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString();
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

export function MetricsSummaryPanel({ metrics, radiusMiles = 1, isLoading }: MetricsSummaryPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 h-24 animate-pulse">
            <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-slate-50 rounded-xl p-8 text-center">
        <p className="text-slate-500">Select a location to view market metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Trade Area Summary
        </h3>
        <span className="text-sm text-slate-500">
          {radiusMiles}-mile radius
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Population"
          value={formatNumber(metrics.total_population)}
          icon={<Users className="h-4 w-4" />}
          trend="up"
          trendValue={`${metrics.growth_rate_5yr?.toFixed(1) || 0}%`}
        />
        <MetricCard
          label="Median Income"
          value={formatCurrency(metrics.median_income)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          label="Growth Rate"
          value={formatPercent(metrics.growth_rate_5yr)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={metrics.growth_rate_5yr && metrics.growth_rate_5yr > 5 ? 'up' : 'neutral'}
        />
        <MetricCard
          label="Spending Index"
          value={metrics.retail_spending_index?.toFixed(0) || '—'}
          icon={<ShoppingCart className="h-4 w-4" />}
          trend={metrics.retail_spending_index && metrics.retail_spending_index > 100 ? 'up' : 'down'}
        />
        <MetricCard
          label="Workforce Score"
          value={metrics.workforce_availability_score?.toFixed(0) || '—'}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <MetricCard
          label="Housing Units"
          value={formatNumber(metrics.total_housing_units)}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Demographics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Median Age</span>
              <span className="font-medium">{metrics.median_age?.toFixed(0) || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bachelor's Degree+</span>
              <span className="font-medium">{formatPercent(metrics.bachelor_degree_pct)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Unemployment</span>
              <span className="font-medium">{formatPercent(metrics.unemployment_rate)}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Housing</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Median Home Value</span>
              <span className="font-medium">{formatCurrency(metrics.median_home_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Occupied</span>
              <span className="font-medium">{formatPercent(metrics.owner_occupied_pct)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vacancy Rate</span>
              <span className="font-medium">{formatPercent(metrics.vacancy_rate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Proprietary Indices */}
      <div className="bg-gradient-to-br from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] rounded-xl p-5 text-white">
        <h4 className="text-sm font-medium opacity-80 mb-4">SiteIntel™ Indices</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">{metrics.growth_potential_index?.toFixed(0) || '—'}</div>
            <div className="text-xs opacity-70">Growth Potential</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{metrics.affluence_concentration?.toFixed(0) || '—'}</div>
            <div className="text-xs opacity-70">Affluence</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{metrics.labor_pool_depth?.toFixed(0) || '—'}</div>
            <div className="text-xs opacity-70">Labor Pool</div>
          </div>
        </div>
      </div>
    </div>
  );
}
