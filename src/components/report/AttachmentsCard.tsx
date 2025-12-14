import { motion } from "framer-motion";
import { Paperclip, FileText, Image, Download, ExternalLink, ChevronDown, File, FileImage, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Attachment {
  id?: string;
  name: string;
  url?: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
  category?: string;
}

interface AttachmentsCardProps {
  attachments?: Attachment[] | null;
  reportAssets?: {
    static_map_url?: string;
    streetview?: Array<{
      direction: string;
      heading: number;
      url: string;
    }>;
  };
  pdfUrl?: string | null;
  className?: string;
}

export function AttachmentsCard({
  attachments = [],
  reportAssets,
  pdfUrl,
  className,
}: AttachmentsCardProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["maps", "documents"]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getFileIcon = (type?: string) => {
    if (!type) return File;
    if (type.includes("image") || type.includes("png") || type.includes("jpg")) return FileImage;
    if (type.includes("pdf")) return FileText;
    if (type.includes("spreadsheet") || type.includes("csv") || type.includes("excel")) return FileSpreadsheet;
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Build categories
  const categories: Record<string, { label: string; icon: React.ElementType; items: Attachment[] }> = {
    maps: { label: "Maps & Imagery", icon: Image, items: [] },
    documents: { label: "Documents", icon: FileText, items: [] },
    other: { label: "Other Files", icon: Paperclip, items: [] },
  };

  // Add report assets
  if (reportAssets?.static_map_url) {
    categories.maps.items.push({
      name: "Static Property Map",
      url: reportAssets.static_map_url,
      type: "image/png",
      category: "maps",
    });
  }

  if (reportAssets?.streetview) {
    reportAssets.streetview.forEach(sv => {
      categories.maps.items.push({
        name: `Street View - ${sv.direction}`,
        url: sv.url,
        type: "image/png",
        category: "maps",
      });
    });
  }

  // Add PDF report
  if (pdfUrl) {
    categories.documents.items.push({
      name: "Feasibility Report (PDF)",
      url: pdfUrl,
      type: "application/pdf",
      category: "documents",
    });
  }

  // Add user attachments
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      const cat = att.category || "other";
      if (categories[cat]) {
        categories[cat].items.push(att);
      } else {
        categories.other.items.push(att);
      }
    });
  }

  // Filter out empty categories
  const activeCategories = Object.entries(categories).filter(([, cat]) => cat.items.length > 0);

  if (activeCategories.length === 0) {
    return null;
  }

  const totalItems = activeCategories.reduce((sum, [, cat]) => sum + cat.items.length, 0);

  return (
    <Card className={cn("glass-card border-l-4 border-l-[hsl(var(--muted-foreground))] overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue)/0.03)] to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            Attachments & Files
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {totalItems} {totalItems === 1 ? "file" : "files"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {activeCategories.map(([key, category], catIndex) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.includes(key);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(key)}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{category.label}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.items.length}
                  </Badge>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform text-muted-foreground",
                    isExpanded && "rotate-180"
                  )} />
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2 space-y-2">
                  {category.items.map((item, itemIndex) => {
                    const ItemIcon = getFileIcon(item.type);
                    return (
                      <motion.div
                        key={item.id || itemIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.05 }}
                        className="flex items-center justify-between p-3 bg-background rounded-lg border group hover:border-[hsl(var(--data-cyan)/0.5)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-[hsl(var(--muted)/0.5)]">
                            <ItemIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.type && <span>{item.type.split("/").pop()?.toUpperCase()}</span>}
                              {item.size && <span>• {formatFileSize(item.size)}</span>}
                              {item.uploadedAt && (
                                <span>• {new Date(item.uploadedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {item.url && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(item.url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = item.url!;
                                link.download = item.name;
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
