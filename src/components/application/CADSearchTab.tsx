/**
 * CAD Search Tab
 * Mode C: Search by County Appraisal District / Assessor's Parcel Number.
 * Validates format per county before querying.
 */

import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hash, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { searchResultToCandidate } from "@/lib/parcelLock";
import { 
  TEXAS_COUNTIES, 
  CAD_FORMAT_CONFIG, 
  validateCADFormat, 
  detectCountyFromAPN,
  normalizeAPN,
} from "@/lib/cadFormatConfig";
import type { CandidateParcel } from "@/types/parcelSelection";

interface CADSearchTabProps {
  onCandidatesFound: (candidates: CandidateParcel[]) => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
}

export function CADSearchTab({
  onCandidatesFound,
  onNavigateToLocation,
}: CADSearchTabProps) {
  const { setLoading, addWarning, clearWarnings } = useParcelSelection();
  const [county, setCounty] = useState("");
  const [apn, setApn] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Auto-detect county from APN format
  const detectedCounty = useMemo(() => {
    if (apn.trim().length >= 6) {
      return detectCountyFromAPN(apn);
    }
    return null;
  }, [apn]);

  // Get format hint for selected county
  const formatHint = useMemo(() => {
    const c = county || detectedCounty;
    if (c && CAD_FORMAT_CONFIG[c]) {
      return CAD_FORMAT_CONFIG[c];
    }
    return null;
  }, [county, detectedCounty]);

  // Validate on input change
  const handleAPNChange = (value: string) => {
    setApn(value);
    setFormatError(null);
    
    const c = county || detectCountyFromAPN(value);
    if (c && value.trim().length >= 6) {
      const validation = validateCADFormat(value, c);
      if (!validation.valid) {
        setFormatError(validation.error || null);
      }
    }
  };

  const handleSearch = useCallback(async () => {
    const selectedCounty = county || detectedCounty;
    
    if (!selectedCounty) {
      return;
    }
    
    if (!apn.trim()) {
      return;
    }

    // Validate format
    const validation = validateCADFormat(apn, selectedCounty);
    if (!validation.valid) {
      setFormatError(validation.error || "Invalid format");
      return;
    }

    clearWarnings();
    setIsSearching(true);
    setLoading(true);

    try {
      const normalizedAPN = normalizeAPN(apn);

      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { 
          query: normalizedAPN,
          type: 'cad',
          county: selectedCounty,
        }
      });

      if (error) throw error;

      let candidates: CandidateParcel[] = [];
      let isExternal = false;

      if (data?.results?.length > 0) {
        const result = data.results[0];
        
        // Check if from canonical or external
        isExternal = result.source !== 'canonical';
        
        if (result.parcel) {
          // Navigate to parcel location
          if (result.lat && result.lng) {
            onNavigateToLocation(result.lat, result.lng, 17);
          }

          candidates = [searchResultToCandidate(
            result.parcel,
            selectedCounty,
            result.confidence || 1.0,
            isExternal ? 'external' : 'canonical'
          )];
        }
      }

      if (candidates.length === 0) {
        console.log('[CADSearchTab] No parcel found');
        addWarning("Parcel not found. Verify the number and county are correct.");
      } else {
        if (isExternal) {
          addWarning("Parcel boundary sourced from county GIS. Accuracy may vary.");
        }
        console.log('[CADSearchTab] Parcel found');
        onCandidatesFound(candidates);
      }

    } catch (err) {
      console.error('[CADSearchTab] Search error:', err);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [apn, county, detectedCounty, onCandidatesFound, onNavigateToLocation, setLoading, addWarning, clearWarnings]);

  return (
    <div className="space-y-4">
      {/* County Selector */}
      <div className="space-y-2">
        <Label htmlFor="county">County</Label>
        <Select value={county || detectedCounty || ""} onValueChange={setCounty}>
          <SelectTrigger>
            <SelectValue placeholder="Select Texas county..." />
          </SelectTrigger>
          <SelectContent>
            {TEXAS_COUNTIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {detectedCounty && !county && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {CAD_FORMAT_CONFIG[detectedCounty]?.name} format detected
            </Badge>
          </div>
        )}
      </div>

      {/* CAD/APN Input */}
      <div className="space-y-2">
        <Label htmlFor="apn">CAD / APN Number</Label>
        <Input
          id="apn"
          placeholder={formatHint?.example || "Enter CAD account number..."}
          value={apn}
          onChange={(e) => handleAPNChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className={formatError ? "border-destructive" : ""}
        />
        {formatHint && !formatError && (
          <p className="text-xs text-muted-foreground">
            Format: {formatHint.hint}
          </p>
        )}
        {formatError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {formatError}
          </p>
        )}
      </div>

      {/* Unsupported County Warning */}
      {county && !CAD_FORMAT_CONFIG[county] && (
        <Alert variant="destructive" className="bg-warning/10 border-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            County parcel data not yet ingested. External lookup only.
          </AlertDescription>
        </Alert>
      )}

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        disabled={isSearching || !apn.trim() || !!formatError}
        className="w-full"
      >
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Hash className="h-4 w-4 mr-2" />
            Find Parcel
          </>
        )}
      </Button>

      {/* Help Text */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Find your CAD number on your property tax statement or the county appraisal district website.
        </AlertDescription>
      </Alert>
    </div>
  );
}
