import { Label } from "@/components/ui/label";
import { ParcelSearchBar } from "@/components/ParcelSearchBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyStepProps {
  formData: {
    propertyAddress: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect?: (parcel: any) => void;
  onEnrichmentComplete?: (data: any) => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function PropertyStep({ 
  formData, 
  onChange, 
  onAddressSelect,
  onParcelSelect,
  onEnrichmentComplete,
  errors,
  isAddressLoading,
  placeholder = "Address, parcel ID, or intersection...",
  label = "Property Address",
  required = true,
  error
}: PropertyStepProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Property Information</legend>

      <div className="space-y-2">
        <Label htmlFor="property-search" className="font-body font-semibold text-charcoal">
          {label} {required && <span className="text-maxx-red">*</span>}
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Search by street address, parcel ID (10+ digits), intersection (e.g., "Main St & Elm Ave"), or click coordinates on map
        </p>
        
        {/* ParcelSearchBar component with all search capabilities */}
        <ParcelSearchBar
          onAddressSelect={onAddressSelect}
          onParcelSelect={onParcelSelect}
          containerClassName="relative"
        />
        
        {error && (
          <p className="text-sm text-maxx-red mt-1">{error}</p>
        )}
        {errors.propertyAddress && !error && (
          <p className="text-sm text-maxx-red mt-1">{errors.propertyAddress}</p>
        )}
      </div>
    </fieldset>
  );
}
