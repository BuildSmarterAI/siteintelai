import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { TradeAreaMetrics } from '@/hooks/useTradeAreaMetrics';

interface DemographicBreakdownChartProps {
  metrics: TradeAreaMetrics | null;
  isLoading?: boolean;
}

const COLORS = {
  primary: '#06B6D4',
  secondary: '#FF7A00',
  tertiary: '#0A0F2C',
  muted: '#94a3b8',
};

export function DemographicBreakdownChart({ metrics, isLoading }: DemographicBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Education breakdown data
  const educationData = [
    { name: 'Bachelor\'s+', value: metrics.bachelor_degree_pct || 0, color: COLORS.primary },
    { name: 'Workforce', value: metrics.workforce_availability_score || 0, color: COLORS.secondary },
    { name: 'Labor Pool', value: metrics.labor_pool_depth || 0, color: COLORS.tertiary },
  ];

  // Housing data
  const housingData = [
    { name: 'Owner', value: metrics.owner_occupied_pct || 0 },
    { name: 'Renter', value: metrics.renter_occupied_pct || 0 },
    { name: 'Vacant', value: metrics.vacancy_rate || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Workforce & Education */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h4 className="text-sm font-semibold text-slate-900 mb-4">
          Workforce & Education Indices
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={educationData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {educationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Housing Tenure */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h4 className="text-sm font-semibold text-slate-900 mb-4">
          Housing Tenure Distribution
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={housingData}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
              />
              <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
