import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, DollarSign } from "lucide-react";

interface IntentSelectionModalProps {
  open: boolean;
  onSelect: (intent: 'build' | 'buy') => void;
}

export function IntentSelectionModal({ open, onSelect }: IntentSelectionModalProps) {
  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            What's your goal for this property?
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            We'll customize your analysis based on your intent
          </p>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card 
            className="cursor-pointer hover:border-primary transition-all border-2"
            onClick={() => onSelect('build')}
          >
            <CardContent className="pt-6 pb-6 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-bold text-lg mb-1">Build / Develop</h3>
              <p className="text-sm text-muted-foreground">
                New construction, ground-up development, or site improvements
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:border-accent transition-all border-2"
            onClick={() => onSelect('buy')}
          >
            <CardContent className="pt-6 pb-6 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-accent" />
              <h3 className="font-bold text-lg mb-1">Buy / Invest</h3>
              <p className="text-sm text-muted-foreground">
                Purchase for investment, leasing, or portfolio acquisition
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
