import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Trash2, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface DraftApplication {
  id: string;
  property_address: string | null;
  formatted_address?: string;
  draft_saved_at: string;
  completion_percent?: number;
  current_step?: number;
}

interface DraftApplicationCardProps {
  draft: DraftApplication;
  onDelete: (id: string) => void;
}

export function DraftApplicationCard({ draft, onDelete }: DraftApplicationCardProps) {
  const navigate = useNavigate();
  
  const completionPercent = draft.completion_percent || 20; // Default to 20% if not set
  const currentStep = draft.current_step || 1;
  const address = draft.formatted_address || draft.property_address || "Property address not entered";
  const lastSaved = draft.draft_saved_at 
    ? formatDistanceToNow(new Date(draft.draft_saved_at), { addSuffix: true })
    : "Unknown";

  const handleContinue = () => {
    navigate(`/application?step=${currentStep}&draft=${draft.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this draft? This action cannot be undone.")) {
      onDelete(draft.id);
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Draft Application
              <Badge variant="secondary" className="text-xs">Step {currentStep} of 5</Badge>
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {address}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(completionPercent)}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last saved {lastSaved}
        </div>

        <Button
          onClick={handleContinue}
          className="w-full"
          variant="default"
        >
          Continue Application
        </Button>
      </CardContent>
    </Card>
  );
}
