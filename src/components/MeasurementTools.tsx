import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ruler, Square, Circle, X } from 'lucide-react';

export type MeasurementMode = 'distance' | 'area' | 'buffer' | null;

interface MeasurementToolsProps {
  activeTool: MeasurementMode;
  onToolChange: (tool: MeasurementMode) => void;
  measurementResult?: {
    type: 'distance' | 'area' | 'buffer';
    value: number;
    unit: string;
  } | null;
}

export function MeasurementTools({
  activeTool,
  onToolChange,
  measurementResult,
}: MeasurementToolsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToolSelect = (tool: MeasurementMode) => {
    onToolChange(tool);
    setIsOpen(false);
  };

  const clearMeasurement = () => {
    onToolChange(null);
  };

  return (
    <div className="absolute top-2 left-2 z-10 flex gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={activeTool ? 'default' : 'secondary'}
            size="sm"
            className="shadow-lg"
          >
            <Ruler className="h-4 w-4 mr-2" />
            Measure
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => handleToolSelect('distance')}
            className="cursor-pointer"
          >
            <Ruler className="h-4 w-4 mr-2" />
            Measure Distance
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleToolSelect('area')}
            className="cursor-pointer"
          >
            <Square className="h-4 w-4 mr-2" />
            Measure Area
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleToolSelect('buffer')}
            className="cursor-pointer"
          >
            <Circle className="h-4 w-4 mr-2" />
            Buffer Zone
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeTool && (
        <Button
          onClick={clearMeasurement}
          size="sm"
          variant="outline"
          className="shadow-lg"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      {measurementResult && (
        <Card className="px-4 py-2 shadow-lg bg-background/95 backdrop-blur-sm">
          <div className="text-sm font-medium text-foreground">
            {measurementResult.type === 'distance' && '📏 Distance: '}
            {measurementResult.type === 'area' && '📐 Area: '}
            {measurementResult.type === 'buffer' && '🎯 Radius: '}
            <span className="text-primary font-bold">
              {measurementResult.value.toFixed(2)} {measurementResult.unit}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
