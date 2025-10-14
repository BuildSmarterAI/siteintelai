import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DataSource {
  dataset_name: string;
  timestamp: string;
  section: string;
}

interface SimplifiedSourcesListProps {
  dataSources: DataSource[];
}

export const SimplifiedSourcesList = ({ dataSources }: SimplifiedSourcesListProps) => {
  if (!dataSources || dataSources.length === 0) {
    return null;
  }

  // Group by section
  const groupedSources = dataSources.reduce((acc, source) => {
    if (!acc[source.section]) {
      acc[source.section] = [];
    }
    acc[source.section].push(source);
    return acc;
  }, {} as Record<string, DataSource[]>);

  // Format timestamp to day-level only (hiding exact times)
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="sticky top-4 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Data Sources</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(groupedSources).map(([section, sources]) => (
            <div key={section} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {section}
              </h4>
              <div className="space-y-1.5">
                {sources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate flex-1">
                      {source.dataset_name}
                    </span>
                    <Badge variant="outline" className="ml-2 text-[10px] font-normal shrink-0">
                      {formatDate(source.timestamp)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
          Full endpoint citations available in PDF report
        </p>
      </CardContent>
    </Card>
  );
};
