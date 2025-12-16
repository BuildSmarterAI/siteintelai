import { cn } from '@/lib/utils';
import { Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';

export type MetricType = 'population' | 'income' | 'growth' | 'spending';

interface MetricSelectorProps {
  selectedMetric: MetricType;
  onSelect: (metric: MetricType) => void;
}

const metrics: { id: MetricType; label: string; icon: typeof Users; description: string }[] = [
  { 
    id: 'population', 
    label: 'Population', 
    icon: Users,
    description: 'Population density by hexagon'
  },
  { 
    id: 'income', 
    label: 'Income', 
    icon: DollarSign,
    description: 'Median household income'
  },
  { 
    id: 'growth', 
    label: 'Growth', 
    icon: TrendingUp,
    description: '5-year growth rate'
  },
  { 
    id: 'spending', 
    label: 'Spending', 
    icon: ShoppingCart,
    description: 'Retail spending index'
  },
];

export function MetricSelector({ selectedMetric, onSelect }: MetricSelectorProps) {
  return (
    <div className="flex gap-2">
      {metrics.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            selectedMetric === id
              ? "bg-[hsl(var(--midnight-blue))] text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
          title={metrics.find(m => m.id === id)?.description}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
