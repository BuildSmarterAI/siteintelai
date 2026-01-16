import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KeyTakeawaysProps {
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  if (takeaways.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 mb-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Key Takeaways</h3>
        </div>
        <ul className="space-y-2">
          {takeaways.map((takeaway, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {takeaway}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
