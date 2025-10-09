import { ChevronDown, Database } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface DataSource {
  dataset_name: string;
  timestamp: string;
  endpoint_url?: string;
  section: string;
}

interface DataSourcesSidebarProps {
  dataSources: DataSource[];
}

export const DataSourcesSidebar = ({ dataSources }: DataSourcesSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <Card className="sticky top-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Data Sources & Timestamps</h3>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4 mt-2">
            {Object.entries(groupedSources).map(([section, sources]) => (
              <div key={section} className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {section}
                </h4>
                <ul className="space-y-1.5">
                  {sources.map((source, idx) => (
                    <li key={idx} className="text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{source.dataset_name}</span>
                        <span className="text-muted-foreground">
                          {new Date(source.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {source.endpoint_url && (
                          <a
                            href={source.endpoint_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            View source
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
