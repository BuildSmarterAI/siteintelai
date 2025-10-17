/**
 * AI Processing Indicator
 * Corporate-grade loading animation representing data processing
 * Replaces generic spinners with branded AI aesthetic
 */

import { cn } from "@/lib/utils";

interface AIProcessingIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AIProcessingIndicator = ({ className, size = 'md' }: AIProcessingIndicatorProps) => {
  const sizeClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  };
  
  const lineWidths = {
    sm: ['w-8', 'w-7', 'w-6'],
    md: ['w-12', 'w-10', 'w-8'],
    lg: ['w-16', 'w-14', 'w-12']
  };
  
  const heights = {
    sm: 'h-[2px]',
    md: 'h-0.5',
    lg: 'h-1'
  };

  return (
    <div className={cn("flex flex-col", sizeClasses[size], className)} role="status" aria-label="Processing data">
      <div 
        className={cn(lineWidths[size][0], heights[size], "bg-primary rounded-full animate-[pulse_1.4s_ease-in-out_infinite]")}
        style={{ animationDelay: '0ms' }} 
      />
      <div 
        className={cn(lineWidths[size][1], heights[size], "bg-accent rounded-full animate-[pulse_1.4s_ease-in-out_infinite]")}
        style={{ animationDelay: '200ms' }} 
      />
      <div 
        className={cn(lineWidths[size][2], heights[size], "bg-primary/60 rounded-full animate-[pulse_1.4s_ease-in-out_infinite]")}
        style={{ animationDelay: '400ms' }} 
      />
    </div>
  );
};
