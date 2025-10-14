import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './input';
import { Label } from './label';
import { supabase } from '@/integrations/supabase/client';
import submarketMapping from '@/data/submarket-mapping.json';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressDetails {
  county?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  sublocality?: string;
  placeId?: string;
  submarket?: string;
  currentUse?: string;
  utilityAccess?: string[];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }, addressDetails?: AddressDetails) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
  applicationId?: string;
  onEnrichmentComplete?: (data: any) => void;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className = "",
  label,
  error,
  required = false,
  applicationId,
  onEnrichmentComplete
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'loading' | 'success' | 'partial' | 'error'>('idle');
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const fetchSuggestions = useCallback(debounce(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { input, sessionToken }
      });

      if (error) throw error;

      if (data?.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, 300), [sessionToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    fetchSuggestions(inputValue);
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-place-details', {
        body: { placeId: suggestion.place_id, sessionToken }
      });

      if (error) throw error;

      let coordinates: { lat: number; lng: number } | undefined;
      const addressDetails: AddressDetails = {
        // Store suggestion's place_id as fallback
        placeId: suggestion.place_id
      };
      
      // Extract coordinates from geometry
      if (data?.result?.geometry?.location) {
        coordinates = {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng
        };
      }

      // Extract address components (county, city, state, ZIP, neighborhood)
      if (data?.result?.address_components) {
        const components = data.result.address_components;
        
        console.log('Google API address_components:', components);
        
        // County (administrative_area_level_2)
        const countyComponent = components.find((c: any) =>
          c.types.includes('administrative_area_level_2')
        );
        if (countyComponent) {
          addressDetails.county = countyComponent.long_name;
        }

        // City (locality)
        const cityComponent = components.find((c: any) =>
          c.types.includes('locality')
        );
        if (cityComponent) {
          addressDetails.city = cityComponent.long_name;
        }

        // State (administrative_area_level_1)
        const stateComponent = components.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        );
        if (stateComponent) {
          addressDetails.state = stateComponent.short_name; // Use short_name for state abbreviation
        }

        // ZIP Code (postal_code)
        const zipComponent = components.find((c: any) =>
          c.types.includes('postal_code')
        );
        if (zipComponent) {
          addressDetails.zipCode = zipComponent.long_name;
        }

        // Neighborhood (try neighborhood first, then sublocality as fallback)
        const neighborhoodComponent = components.find((c: any) =>
          c.types.includes('neighborhood')
        );
        if (neighborhoodComponent) {
          addressDetails.neighborhood = neighborhoodComponent.long_name;
        }

        // Sublocality (use as both sublocality AND neighborhood fallback)
        const sublocalityComponent = components.find((c: any) =>
          c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
        );
        if (sublocalityComponent) {
          addressDetails.sublocality = sublocalityComponent.long_name;
          // Use sublocality as neighborhood fallback if neighborhood not found
          if (!addressDetails.neighborhood) {
            addressDetails.neighborhood = sublocalityComponent.long_name;
          }
        }
        
        // Final fallback: use city if neighborhood still missing
        if (!addressDetails.neighborhood && addressDetails.city) {
          addressDetails.neighborhood = addressDetails.city;
        }
        
        console.log('Extracted address details:', addressDetails);
      }

      // Override with Place ID from details if available (more reliable)
      if (data?.result?.place_id) {
        addressDetails.placeId = data.result.place_id;
      }

      // Auto-detect current use from place types
      if (data?.result?.types) {
        const types = data.result.types;
        if (types.includes('parking')) {
          addressDetails.currentUse = 'parking-lot';
        } else if (types.includes('point_of_interest') || types.includes('establishment') || types.includes('store')) {
          addressDetails.currentUse = 'existing-occupied';
        } else if (types.length === 1 && types[0] === 'street_address') {
          addressDetails.currentUse = 'vacant-land';
        }
      }

      // Auto-detect submarket from neighborhood
      if (addressDetails.city && addressDetails.neighborhood) {
        const cityData = submarketMapping[addressDetails.city as keyof typeof submarketMapping];
        if (cityData) {
          const submarket = cityData[addressDetails.neighborhood as keyof typeof cityData];
          if (submarket) {
            addressDetails.submarket = submarket;
          }
        }
      }

      const finalAddress = data?.result?.formatted_address || suggestion.description;
      
      if (data?.result?.formatted_address) {
        onChange(data.result.formatted_address, coordinates, addressDetails);
      } else {
        onChange(suggestion.description, coordinates, addressDetails);
      }

      // Trigger GIS enrichment (without application_id during form fill)
      setEnrichmentStatus('loading');
      try {
        const { data: enrichData, error: enrichError } = await supabase.functions.invoke('enrich-feasibility', {
          body: {
            address: finalAddress
          }
        });

        if (enrichError) throw enrichError;

        if (enrichData?.success) {
          const hasFlags = Array.isArray(enrichData.data_flags) && enrichData.data_flags.length > 0;
          setEnrichmentStatus(hasFlags ? 'partial' : 'success');
          
          // Auto-populate utility access from enriched data
          if (coordinates) {
            try {
              const { data: utilityData, error: utilityError } = await supabase.functions.invoke('enrich-utilities', {
                body: {
                  latitude: coordinates.lat,
                  longitude: coordinates.lng
                }
              });

              if (!utilityError && utilityData) {
                const utilityAccess: string[] = [];
                if (utilityData.water_nearby) utilityAccess.push('water');
                if (utilityData.sewer_nearby) utilityAccess.push('sewer');
                if (utilityData.storm_nearby) utilityAccess.push('storm');
                // Gas and electric are typically available in developed areas
                if (addressDetails.city) {
                  utilityAccess.push('electric');
                }
                addressDetails.utilityAccess = utilityAccess;
              }
            } catch (utilityError) {
              console.error('Utility enrichment error:', utilityError);
            }
          }
          
          onEnrichmentComplete?.(enrichData);
        } else {
          setEnrichmentStatus('error');
          console.error('Enrichment failed:', enrichData?.error);
        }
      } catch (enrichError) {
        console.error('GIS enrichment error:', enrichError);
        setEnrichmentStatus('error');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Still pass the suggestion's place_id even on error
      onChange(suggestion.description, undefined, { placeId: suggestion.place_id });
    }

    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      {label && (
        <Label htmlFor="address-autocomplete" className="font-body font-semibold text-charcoal flex items-center gap-1">
          {label} {required && <span className="text-maxx-red text-lg">*</span>}
        </Label>
      )}
      <Input
        ref={inputRef}
        id="address-autocomplete"
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`mt-2 ${error ? 'border-maxx-red focus:border-maxx-red' : 'border-charcoal/20'} ${className}`}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={showSuggestions ? "address-suggestions" : undefined}
        aria-expanded={showSuggestions}
        aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
        role="combobox"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          id="address-suggestions"
          className="absolute top-full left-0 right-0 z-50 bg-white border border-charcoal/20 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          role="listbox"
          aria-label="Address suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              id={`suggestion-${index}`}
              ref={el => suggestionRefs.current[index] = el}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur from firing
                handleSuggestionClick(suggestion);
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="font-medium text-charcoal">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-sm text-charcoal/60">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {isLoading && (
        <div 
          className="absolute top-full left-0 right-0 z-50 bg-white border border-charcoal/20 rounded-md shadow-lg mt-1"
          role="status"
          aria-live="polite"
        >
          <div className="px-4 py-3 text-center text-charcoal/60">
            Searching addresses...
          </div>
        </div>
      )}
      
      {enrichmentStatus === 'loading' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600" role="status" aria-live="polite">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" aria-hidden="true"></div>
          <span>Loading GIS data...</span>
        </div>
      )}
      
      {enrichmentStatus === 'success' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600" role="status" aria-live="polite">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>GIS Data Loaded ✅</span>
        </div>
      )}

      {enrichmentStatus === 'partial' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600" role="status" aria-live="polite">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>Property data loaded from HCAD</span>
        </div>
      )}

      {enrichmentStatus === 'error' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600" role="alert" aria-live="assertive">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>Auto-fill unavailable — please enter details manually.</span>
        </div>
      )}

      <p className="text-sm text-charcoal/60 mt-1">
        Exact location helps us validate zoning and utility access.
      </p>
      
      {error && <p className="text-maxx-red text-sm mt-1">{error}</p>}
    </div>
  );
}