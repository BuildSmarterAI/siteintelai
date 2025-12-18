import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParcelSearchBar } from "@/components/ParcelSearchBar";
import { DrawParcelSection } from "./DrawParcelSection";
import { Search, Hash, PenTool, Loader2, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ParcelSearchPanelProps {
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect: (parcel: any) => void;
  onAPNSelect: (parcel: any) => void;
  onDrawnParcel: (parcel: { 
    geometry: GeoJSON.Polygon; 
    name: string; 
    acreage: number; 
    centroid: { lat: number; lng: number }; 
    id?: string 
  }) => void;
  mapCenter: [number, number];
  applicationId?: string;
  currentAddress?: string;
}

const COUNTY_OPTIONS = [
  { value: 'all', label: 'All Counties' },
  { value: 'harris', label: 'Harris County' },
  { value: 'fort_bend', label: 'Fort Bend County' },
  { value: 'montgomery', label: 'Montgomery County' },
  { value: 'galveston', label: 'Galveston County' },
  { value: 'brazoria', label: 'Brazoria County' },
];

export function ParcelSearchPanel({
  onAddressSelect,
  onParcelSelect,
  onAPNSelect,
  onDrawnParcel,
  mapCenter,
  applicationId,
  currentAddress
}: ParcelSearchPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("address");
  const [apnQuery, setApnQuery] = useState("");
  const [apnCounty, setApnCounty] = useState("all");
  const [isAPNLoading, setIsAPNLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDrawPanel, setShowDrawPanel] = useState(false);

  // Handle APN search
  const handleAPNSearch = useCallback(async () => {
    if (!apnQuery.trim()) {
      toast({
        title: "Enter APN/Account Number",
        description: "Please enter a parcel APN or account number to search.",
        variant: "destructive"
      });
      return;
    }

    setIsAPNLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-parcel-by-apn', {
        body: { 
          apn: apnQuery.trim(),
          county: apnCounty !== 'all' ? apnCounty : undefined
        }
      });

      if (error) throw error;

      if (data?.parcel) {
        onAPNSelect(data.parcel);
        toast({
          title: "Parcel Found",
          description: `Found parcel ${data.parcel.id || apnQuery}`,
        });
      } else {
        toast({
          title: "No Parcel Found",
          description: "No parcel matches that APN/account number. Try a different search or draw manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[ParcelSearchPanel] APN search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search by APN. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAPNLoading(false);
    }
  }, [apnQuery, apnCounty, onAPNSelect, toast]);

  // Handle draw tab click
  const handleDrawTabClick = () => {
    setActiveTab("draw");
    setShowDrawPanel(true);
  };

  // If we have a current address, show a collapsed state
  if (currentAddress && isCollapsed) {
    return (
      <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentAddress}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
            >
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-border/50">
      <CardContent className="p-4">
        {/* Header with collapse option */}
        {currentAddress && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{currentAddress}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="address" className="gap-2 text-xs sm:text-sm">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Address</span>
            </TabsTrigger>
            <TabsTrigger value="apn" className="gap-2 text-xs sm:text-sm">
              <Hash className="h-4 w-4" />
              <span className="hidden sm:inline">APN #</span>
            </TabsTrigger>
            <TabsTrigger 
              value="draw" 
              className="gap-2 text-xs sm:text-sm"
              onClick={handleDrawTabClick}
            >
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Draw</span>
            </TabsTrigger>
          </TabsList>

          {/* Address Search Tab */}
          <TabsContent value="address" className="mt-0">
            <div className="space-y-3">
              <ParcelSearchBar
                onAddressSelect={onAddressSelect}
                onParcelSelect={onParcelSelect}
                containerClassName="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Search by street address or click a parcel on the map
              </p>
            </div>
          </TabsContent>

          {/* APN Search Tab */}
          <TabsContent value="apn" className="mt-0">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={apnCounty} onValueChange={setApnCounty}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter APN or Account #"
                    value={apnQuery}
                    onChange={(e) => setApnQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAPNSearch()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleAPNSearch}
                    disabled={isAPNLoading}
                  >
                    {isAPNLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Search by County Appraisal District account number
              </p>
            </div>
          </TabsContent>

          {/* Draw Parcel Tab */}
          <TabsContent value="draw" className="mt-0">
            <AnimatePresence>
              {showDrawPanel ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <DrawParcelSection
                    onParcelDrawn={onDrawnParcel}
                    initialCenter={mapCenter}
                    applicationId={applicationId}
                  />
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowDrawPanel(true)}
                  >
                    <PenTool className="h-4 w-4" />
                    Start Drawing Custom Boundary
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Draw custom parcel boundaries for properties not in county records
                  </p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
