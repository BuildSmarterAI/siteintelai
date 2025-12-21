import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParcelComparisonStore } from '@/stores/useParcelComparisonStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ParcelComparisonFABProps {
  onOpenPanel: () => void;
}

export function ParcelComparisonFAB({ onOpenPanel }: ParcelComparisonFABProps) {
  const { comparedParcels, clearComparison, maxParcels } = useParcelComparisonStore();

  const count = comparedParcels.length;

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
      >
        <TooltipProvider>
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-full shadow-xl px-2 py-1.5 flex items-center gap-2">
            {/* Comparison count */}
            <div className="flex items-center gap-1.5 px-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {count}/{maxParcels} parcels
              </span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border" />

            {/* Compare button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full"
                  onClick={onOpenPanel}
                  disabled={count < 2}
                >
                  Compare
                  {count >= 2 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {count < 2 ? 'Select at least 2 parcels to compare' : 'Open comparison panel'}
              </TooltipContent>
            </Tooltip>

            {/* Clear button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={clearComparison}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all selected parcels</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </motion.div>
    </AnimatePresence>
  );
}
