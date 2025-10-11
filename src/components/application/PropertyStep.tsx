import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyStepProps {
  formData: {
    propertyAddress: string;
    ownershipStatus: string;
  };
  onChange: (field: string, value: any) => void;
  onAddressSelect: (address: any) => void;
  errors: Record<string, string>;
  isAddressLoading: boolean;
}

export function PropertyStep({ 
  formData, 
  onChange, 
  onAddressSelect, 
  errors,
  isAddressLoading 
}: PropertyStepProps) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Property Information</legend>
      
      <div className="space-y-2">
        <AddressAutocomplete
          value={formData.propertyAddress}
          onChange={onAddressSelect}
          label="Property Address"
          required
          className="touch-target"
          error={errors.propertyAddress}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownershipStatus" className="text-base">
          Ownership Status <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <Select
          value={formData.ownershipStatus}
          onValueChange={(value) => onChange('ownershipStatus', value)}
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
