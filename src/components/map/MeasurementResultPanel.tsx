import { Ruler, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MeasurementMode, MeasurementResult } from '@/hooks/useMapMeasurement';

interface MeasurementResultPanelProps {
  activeTool: MeasurementMode;
  result: MeasurementResult | null;
  onClear: () => void;
}

/**
 * Panel to display measurement results (distance/area)
 * Extracted from MapLibreCanvas for better separation of concerns
 */
export function MeasurementResultPanel({
  activeTool,
  result,
  onClear,
}: MeasurementResultPanelProps) {
  if (!result) return null;

  const handleCopy = () => {
    const text =
      activeTool === 'distance' && result.miles !== undefined
        ? `Distance: ${result.miles.toFixed(2)} mi (${result.feet?.toLocaleString()} ft)`
        : `Area: ${result.acres?.toFixed(2)} ac (${result.sqft?.toLocaleString()} sq ft)`;

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="absolute bottom-20 left-4 z-20 bg-background/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 min-w-[250px] border border-primary/20 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" />
          Measurement Result
        </h4>
        <Button size="sm" variant="ghost" onClick={onClear} className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {activeTool === 'distance' && result.miles !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
              Distance
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {result.miles.toFixed(2)} mi
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {result.feet?.toLocaleString()} ft
            </div>
          </div>
        )}

        {activeTool === 'area' && result.acres !== undefined && (
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
              Area
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {result.acres.toFixed(2)} ac
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {result.sqft?.toLocaleString()} sq ft
            </div>
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full" onClick={handleCopy}>
          <Copy className="h-3 w-3 mr-2" />
          Copy to Clipboard
        </Button>
      </div>
    </div>
  );
}
