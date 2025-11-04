import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyStepProps {
  formData: {
    propertyAddress: string;
    ownershipStatus: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (value: any, coordinates: any, addressDetails: any) => void;
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
  onEnrichmentComplete,
  errors,
  isAddressLoading,
  placeholder = "123 Main Street, City, State, ZIP",
  label = "Property Address",
  required = true,
  error
}: PropertyStepProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Property Information</legend>

      <div className="space-y-2">
        <AddressAutocomplete
          value={formData.propertyAddress}
          onChange={onAddressSelect}
          onEnrichmentComplete={onEnrichmentComplete}
          placeholder={placeholder}
          label={label}
          required={required}
          className="touch-target"
          error={error || errors.propertyAddress}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownershipStatus" className="text-base">
          Ownership Status <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <Select
          value={formData.ownershipStatus}
          onValueChange={(value) => {
            console.log('[PropertyStep] ownershipStatus changing to:', value);
            onChange('ownershipStatus', value);
          }}
        >
          <SelectTrigger 
            id="ownershipStatus" 
            className="touch-target"
            aria-invalid={!!errors.ownershipStatus}
            aria-describedby={errors.ownershipStatus ? "ownership-error" : undefined}
          >
            <SelectValue placeholder="Select ownership status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owned">I own this property</SelectItem>
            <SelectItem value="under-contract">Under contract</SelectItem>
            <SelectItem value="prospecting">Prospecting</SelectItem>
          </SelectContent>
        </Select>
        {errors.ownershipStatus && (
          <p id="ownership-error" className="text-sm text-destructive" role="alert">
            {errors.ownershipStatus}
          </p>
        )}
      </div>
    </fieldset>
  );
}
