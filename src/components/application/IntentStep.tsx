import { Card, CardContent } from "@/components/ui/card";
import { Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentStepProps {
  selectedIntent: 'build' | 'buy' | '';
  onSelect: (intent: 'build' | 'buy') => void;
}

export function IntentStep({ selectedIntent, onSelect }: IntentStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">What's your goal for this property?</h2>
        <p className="text-muted-foreground">We'll customize your analysis based on your intent</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card 
          className={cn(
            "cursor-pointer hover:border-primary transition-all border-2 h-full",
            selectedIntent === 'build' && "border-primary bg-primary/5"
          )}
          onClick={() => onSelect('build')}
        >
          <CardContent className="pt-8 pb-8 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="font-bold text-xl mb-2">Build / Develop</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              New construction, ground-up development, or site improvements
            </p>
            <ul className="mt-4 space-y-1 text-xs text-left text-muted-foreground">
              <li>• Zoning & permit analysis</li>
              <li>• Utility connection costs</li>
              <li>• Construction feasibility</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "cursor-pointer hover:border-accent transition-all border-2 h-full",
            selectedIntent === 'buy' && "border-accent bg-accent/5"
          )}
          onClick={() => onSelect('buy')}
        >
          <CardContent className="pt-8 pb-8 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-accent" />
            <h3 className="font-bold text-xl mb-2">Buy / Invest</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Purchase for investment, leasing, or portfolio acquisition
            </p>
            <ul className="mt-4 space-y-1 text-xs text-left text-muted-foreground">
              <li>• Market value analysis</li>
              <li>• ROI & cap rate estimates</li>
              <li>• Investment risk factors</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
