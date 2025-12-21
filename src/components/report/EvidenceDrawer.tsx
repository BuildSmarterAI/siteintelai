import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ExternalLink, 
  FileText, 
  Database, 
  Info, 
  MessageSquare, 
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Droplets,
  Landmark,
  Cable,
  Leaf,
  Car,
  Users,
  User
} from "lucide-react";
import { useEvidenceDrawer } from "@/contexts/EvidenceDrawerContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { EvidenceDomain } from "@/types/evidence";

const DOMAIN_ICONS: Record<EvidenceDomain, typeof Droplets> = {
  flood: Droplets,
  zoning: Landmark,
  utilities: Cable,
  environmental: Leaf,
  traffic: Car,
  market: Users,
  property: User,
};

const DOMAIN_COLORS: Record<EvidenceDomain, string> = {
  flood: 'text-blue-500',
  zoning: 'text-purple-500',
  utilities: 'text-green-500',
  environmental: 'text-emerald-500',
  traffic: 'text-orange-500',
  market: 'text-purple-500',
  property: 'text-cyan-500',
};

export function EvidenceDrawer() {
  const { isOpen, activeTab, data, closeDrawer, setActiveTab } = useEvidenceDrawer();
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const DomainIcon = DOMAIN_ICONS[data.domain];
  const domainColor = DOMAIN_COLORS[data.domain];

  const getFreshnessIcon = () => {
    switch (data.sourceMetadata.freshnessStatus) {
      case 'fresh':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'recent':
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case 'stale':
        return <XCircle className="h-3 w-3 text-red-500" />;
    }
  };

  const getFreshnessColor = () => {
    switch (data.sourceMetadata.freshnessStatus) {
      case 'fresh':
        return 'bg-green-500/10 text-green-700 border-green-500/30';
      case 'recent':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
      case 'stale':
        return 'bg-red-500/10 text-red-700 border-red-500/30';
    }
  };

  const copyRawData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data.rawData, null, 2));
      setCopied(true);
      toast.success("Raw data copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSourceYear = () => {
    return new Date(data.sourceMetadata.timestamp).getFullYear();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-white/10", domainColor)}>
                <DomainIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white text-lg">{data.title}</SheetTitle>
                <SheetDescription className="text-white/60">
                  {data.sourceMetadata.sourceDisplayName}
                </SheetDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-xs font-mono">
              {data.sourceMetadata.sourceName}
            </Badge>
          </div>

          {/* Freshness Chip */}
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className={cn("flex items-center gap-1.5", getFreshnessColor())}>
              {getFreshnessIcon()}
              <span className="font-mono text-xs">
                {data.sourceMetadata.sourceName} ({getSourceYear()})
              </span>
              <span className="mx-1">•</span>
              <span>
                {data.sourceMetadata.freshnessStatus === 'fresh' ? 'Fresh' : 
                 data.sourceMetadata.freshnessStatus === 'recent' ? 'Recent' : 'Stale'}
                {' '}{data.sourceMetadata.freshnessDays}d
              </span>
              <span className="mx-1">•</span>
              <span>
                {data.sourceMetadata.reliabilityScore >= 80 ? 'High' : 
                 data.sourceMetadata.reliabilityScore >= 50 ? 'Medium' : 'Low'}
              </span>
            </Badge>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger 
              value="evidence" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              Evidence
            </TabsTrigger>
            <TabsTrigger 
              value="raw" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Database className="h-4 w-4 mr-2" />
              Raw Data
            </TabsTrigger>
            <TabsTrigger 
              value="metadata" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Info className="h-4 w-4 mr-2" />
              Metadata
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Evidence Tab */}
            <TabsContent value="evidence" className="p-6 mt-0 space-y-6">
              {/* Source Info */}
              <div className="p-4 bg-muted/30 rounded-xl border">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Data Source</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {data.sourceMetadata.sourceDisplayName}
                </p>
                {data.sourceMetadata.sourceUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(data.sourceMetadata.sourceUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Source Portal
                  </Button>
                )}
              </div>

              {/* PDF Link if available */}
              {data.pdfUrl && (
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">Source Document</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(data.pdfUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View PDF Document
                  </Button>
                </div>
              )}

              {/* Key Data Summary */}
              <div className="p-4 bg-muted/30 rounded-xl border">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Key Data Points</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(data.rawData).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono font-medium">
                        {value !== null && value !== undefined 
                          ? String(value).length > 30 
                            ? `${String(value).substring(0, 30)}...` 
                            : String(value)
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Raw Data Tab */}
            <TabsContent value="raw" className="p-6 mt-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">API Response Data</span>
                <Button variant="outline" size="sm" onClick={copyRawData}>
                  {copied ? (
                    <Check className="h-3 w-3 mr-2 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 mr-2" />
                  )}
                  {copied ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>
              <pre className="p-4 bg-[hsl(var(--midnight-blue))] text-white rounded-xl text-xs font-mono overflow-auto max-h-[60vh]">
                {JSON.stringify(data.rawData, null, 2)}
              </pre>
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="p-6 mt-0 space-y-4">
              {/* Freshness Card */}
              <div className={cn(
                "p-4 rounded-xl border-2",
                data.sourceMetadata.freshnessStatus === 'fresh' 
                  ? "bg-green-500/10 border-green-500/30" 
                  : data.sourceMetadata.freshnessStatus === 'recent'
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-red-500/10 border-red-500/30"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold text-sm">Data Freshness</span>
                </div>
                <div className="text-2xl font-bold font-mono mb-1">
                  {data.sourceMetadata.freshnessDays} days old
                </div>
                <p className="text-sm text-muted-foreground">
                  Last updated: {formatDate(data.sourceMetadata.timestamp)}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid gap-3">
                <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <span className="font-medium text-sm">{data.sourceMetadata.sourceDisplayName}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reliability Score</span>
                  <Badge variant={
                    data.sourceMetadata.reliabilityScore >= 80 ? "default" :
                    data.sourceMetadata.reliabilityScore >= 50 ? "secondary" : "destructive"
                  }>
                    {data.sourceMetadata.reliabilityScore}%
                  </Badge>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Retrieval Method</span>
                  <Badge variant="outline" className="capitalize">
                    {data.sourceMetadata.retrievalMethod.replace('_', ' ')}
                  </Badge>
                </div>
                {data.sourceMetadata.datasetVersion && (
                  <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dataset Version</span>
                    <span className="font-mono text-sm">{data.sourceMetadata.datasetVersion}</span>
                  </div>
                )}
                {data.sourceMetadata.apiEndpoint && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground block mb-1">API Endpoint</span>
                    <code className="text-xs font-mono text-muted-foreground break-all">
                      {data.sourceMetadata.apiEndpoint}
                    </code>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="p-6 mt-0">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-muted-foreground mb-2">No Notes Yet</h3>
                <p className="text-sm text-muted-foreground">
                  User annotations and system notes will appear here in a future update.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
