/**
 * Property Classification Lookup Tables
 * Maps Texas State Class Codes and HCAD Land Use Codes to human-readable descriptions
 */

export interface StateClassInfo {
  description: string;
  category: 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural' | 'Exempt' | 'Utility' | 'Other';
  color: string; // Tailwind-compatible color class
}

export interface LandUseInfo {
  description: string;
  category: string;
}

// Texas State Class Codes per Texas Comptroller standards
export const STATE_CLASS_CODES: Record<string, StateClassInfo> = {
  // Residential (Category A/B)
  'A1': { description: 'Real, Residential, Single-Family', category: 'Residential', color: 'blue' },
  'A2': { description: 'Real, Residential, Mobile Home', category: 'Residential', color: 'blue' },
  'A3': { description: 'Real, Residential, Multi-Unit (2-4)', category: 'Residential', color: 'blue' },
  'B1': { description: 'Real, Residential, Multi-Family (5+)', category: 'Residential', color: 'blue' },
  'B2': { description: 'Real, Residential, Multi-Family Common Area', category: 'Residential', color: 'blue' },
  'B3': { description: 'Real, Townhouse (Attached)', category: 'Residential', color: 'blue' },
  'B4': { description: 'Real, Condominium', category: 'Residential', color: 'blue' },
  
  // Commercial (Category F)
  'C1': { description: 'Vacant Commercial', category: 'Commercial', color: 'orange' },
  'C2': { description: 'Commercial Land (Minor Improvements)', category: 'Commercial', color: 'orange' },
  'F1': { description: 'Real, Commercial', category: 'Commercial', color: 'orange' },
  'F2': { description: 'Real, Industrial', category: 'Industrial', color: 'purple' },
  'F3': { description: 'Real, Commercial (Special Use)', category: 'Commercial', color: 'orange' },
  
  // Agricultural (Category D)
  'D1': { description: 'Qualified Open-Space Land', category: 'Agricultural', color: 'green' },
  'D2': { description: 'Non-Qualified Agricultural Land', category: 'Agricultural', color: 'green' },
  'D3': { description: 'Agricultural Improvements on D Land', category: 'Agricultural', color: 'green' },
  'D4': { description: 'Rural Acreage (Non-Ag)', category: 'Agricultural', color: 'green' },
  
  // Exempt (Category X)
  'X1': { description: 'Exempt, Public Property', category: 'Exempt', color: 'gray' },
  'X2': { description: 'Exempt, Religious', category: 'Exempt', color: 'gray' },
  'X3': { description: 'Exempt, Charitable', category: 'Exempt', color: 'gray' },
  'X4': { description: 'Exempt, Educational', category: 'Exempt', color: 'gray' },
  'XV': { description: 'Exempt (Other)', category: 'Exempt', color: 'gray' },
  'XB': { description: 'Exempt Business Personal Property', category: 'Exempt', color: 'gray' },
  'XR': { description: 'Exempt Residential', category: 'Exempt', color: 'gray' },
  'XS': { description: 'Exempt State Property', category: 'Exempt', color: 'gray' },
  'XU': { description: 'Exempt Federal Property', category: 'Exempt', color: 'gray' },
  'XC': { description: 'Exempt County Property', category: 'Exempt', color: 'gray' },
  
  // Industrial (Category L/M)
  'L1': { description: 'Commercial Personal Property', category: 'Commercial', color: 'orange' },
  'L2': { description: 'Industrial Personal Property', category: 'Industrial', color: 'purple' },
  'M1': { description: 'Mobile Home (Residential)', category: 'Residential', color: 'blue' },
  'M2': { description: 'Mobile Home (Commercial)', category: 'Commercial', color: 'orange' },
  
  // Utilities (Category J)
  'J1': { description: 'Water Systems', category: 'Utility', color: 'cyan' },
  'J2': { description: 'Gas Distribution', category: 'Utility', color: 'cyan' },
  'J3': { description: 'Electric Companies', category: 'Utility', color: 'cyan' },
  'J4': { description: 'Telephone Companies', category: 'Utility', color: 'cyan' },
  'J5': { description: 'Railroad Companies', category: 'Utility', color: 'cyan' },
  'J6': { description: 'Pipeline Companies', category: 'Utility', color: 'cyan' },
  'J7': { description: 'Cable Companies', category: 'Utility', color: 'cyan' },
  
  // Special (Category G/E/O)
  'E1': { description: 'Farm & Ranch Improvement', category: 'Agricultural', color: 'green' },
  'E2': { description: 'Farm & Ranch Improvement (Mobile Home)', category: 'Agricultural', color: 'green' },
  'G1': { description: 'Oil & Gas Reserves', category: 'Other', color: 'slate' },
  'G2': { description: 'Minerals (Other)', category: 'Other', color: 'slate' },
  'O1': { description: 'Residential Inventory', category: 'Residential', color: 'blue' },
  'O2': { description: 'Commercial Inventory', category: 'Commercial', color: 'orange' },
  'S1': { description: 'Special Inventory - Dealer Motor Vehicles', category: 'Commercial', color: 'orange' },
};

// HCAD Land Use Codes (comprehensive mapping)
export const LAND_USE_CODES: Record<string, LandUseInfo> = {
  // 1000 Series - Vacant Residential
  '1000': { description: 'Vacant Residential', category: 'Vacant' },
  '1001': { description: 'Vacant Residential - Single Family', category: 'Vacant' },
  '1002': { description: 'Vacant Residential - Multi-Family', category: 'Vacant' },
  '1003': { description: 'Vacant Residential - Acreage', category: 'Vacant' },
  '1010': { description: 'Platted Vacant - Residential', category: 'Vacant' },
  '1020': { description: 'Unplatted Vacant - Residential', category: 'Vacant' },
  
  // 2000 Series - Improved Residential
  '2000': { description: 'Residential Improved', category: 'Residential' },
  '2001': { description: 'Single Family Residence', category: 'Residential' },
  '2002': { description: 'Duplex', category: 'Residential' },
  '2003': { description: 'Triplex', category: 'Residential' },
  '2004': { description: 'Fourplex', category: 'Residential' },
  '2010': { description: 'Single Family - Patio Home', category: 'Residential' },
  '2020': { description: 'Single Family - Townhouse', category: 'Residential' },
  '2030': { description: 'Single Family - Zero Lot Line', category: 'Residential' },
  '2101': { description: 'Multi-Family (5-50 units)', category: 'Residential' },
  '2102': { description: 'Multi-Family (51-100 units)', category: 'Residential' },
  '2103': { description: 'Multi-Family (100+ units)', category: 'Residential' },
  '2104': { description: 'High-Rise Multi-Family', category: 'Residential' },
  '2200': { description: 'Condominium', category: 'Residential' },
  '2201': { description: 'Condo - Low Rise', category: 'Residential' },
  '2202': { description: 'Condo - Mid Rise', category: 'Residential' },
  '2203': { description: 'Condo - High Rise', category: 'Residential' },
  '2300': { description: 'Mobile Home', category: 'Residential' },
  '2301': { description: 'Mobile Home on Owned Land', category: 'Residential' },
  '2302': { description: 'Mobile Home Park', category: 'Residential' },
  
  // 3000 Series - Agricultural
  '3000': { description: 'Agricultural', category: 'Agricultural' },
  '3001': { description: 'Agriculture - Farm/Ranch', category: 'Agricultural' },
  '3002': { description: 'Agriculture - Timber', category: 'Agricultural' },
  '3003': { description: 'Agriculture - Orchard', category: 'Agricultural' },
  '3004': { description: 'Agriculture - Pasture', category: 'Agricultural' },
  '3010': { description: 'Agricultural - Open Space', category: 'Agricultural' },
  '3100': { description: 'Agriculture with Improvements', category: 'Agricultural' },
  
  // 4000 Series - Vacant Commercial
  '4000': { description: 'Vacant Commercial', category: 'Vacant' },
  '4001': { description: 'Vacant Commercial - CBD', category: 'Vacant' },
  '4002': { description: 'Vacant Commercial - Retail Strip', category: 'Vacant' },
  '4003': { description: 'Vacant Commercial - Industrial', category: 'Vacant' },
  '4100': { description: 'Vacant Commercial Acreage', category: 'Vacant' },
  '4200': { description: 'Vacant Commercial Tract', category: 'Vacant' },
  '4300': { description: 'General Commercial Vacant', category: 'Vacant' },
  '4301': { description: 'Neighborhood Commercial Vacant', category: 'Vacant' },
  '4302': { description: 'Community Commercial Vacant', category: 'Vacant' },
  '4353': { description: 'Office Buildings Low-Rise (1-4 Stories)', category: 'Commercial' },
  '4354': { description: 'Office Buildings Mid-Rise (5-9 Stories)', category: 'Commercial' },
  '4355': { description: 'Office Buildings High-Rise (10+ Stories)', category: 'Commercial' },
  
  // 5000 Series - Improved Commercial
  '5000': { description: 'Commercial Improved', category: 'Commercial' },
  '5001': { description: 'Retail Store', category: 'Commercial' },
  '5002': { description: 'Restaurant', category: 'Commercial' },
  '5003': { description: 'Service Station', category: 'Commercial' },
  '5004': { description: 'Auto Dealership', category: 'Commercial' },
  '5005': { description: 'Shopping Center - Neighborhood', category: 'Commercial' },
  '5006': { description: 'Shopping Center - Community', category: 'Commercial' },
  '5007': { description: 'Shopping Center - Regional', category: 'Commercial' },
  '5008': { description: 'Mall', category: 'Commercial' },
  '5010': { description: 'Office Building - General', category: 'Commercial' },
  '5011': { description: 'Office Building - Low Rise', category: 'Commercial' },
  '5012': { description: 'Office Building - Mid Rise', category: 'Commercial' },
  '5013': { description: 'Office Building - High Rise', category: 'Commercial' },
  '5020': { description: 'Bank', category: 'Commercial' },
  '5030': { description: 'Medical Office', category: 'Commercial' },
  '5040': { description: 'Hospital', category: 'Commercial' },
  '5050': { description: 'Hotel/Motel', category: 'Commercial' },
  '5051': { description: 'Hotel - Full Service', category: 'Commercial' },
  '5052': { description: 'Hotel - Limited Service', category: 'Commercial' },
  '5053': { description: 'Motel', category: 'Commercial' },
  '5054': { description: 'Extended Stay', category: 'Commercial' },
  '5060': { description: 'Theater/Entertainment', category: 'Commercial' },
  '5070': { description: 'Bowling Alley', category: 'Commercial' },
  '5080': { description: 'Health Club/Gym', category: 'Commercial' },
  '5090': { description: 'Car Wash', category: 'Commercial' },
  
  // 6000 Series - Industrial
  '6000': { description: 'Industrial', category: 'Industrial' },
  '6001': { description: 'Light Manufacturing', category: 'Industrial' },
  '6002': { description: 'Heavy Manufacturing', category: 'Industrial' },
  '6003': { description: 'Warehouse', category: 'Industrial' },
  '6004': { description: 'Distribution Center', category: 'Industrial' },
  '6005': { description: 'Flex Space', category: 'Industrial' },
  '6006': { description: 'Research & Development', category: 'Industrial' },
  '6010': { description: 'Industrial Park', category: 'Industrial' },
  '6020': { description: 'Refinery/Chemical', category: 'Industrial' },
  '6030': { description: 'Food Processing', category: 'Industrial' },
  '6040': { description: 'Cold Storage', category: 'Industrial' },
  '6050': { description: 'Truck Terminal', category: 'Industrial' },
  '6060': { description: 'Mini-Warehouse/Self Storage', category: 'Industrial' },
  
  // 7000 Series - Special Purpose/Exempt
  '7000': { description: 'Special Purpose', category: 'Special' },
  '7001': { description: 'Church/Religious', category: 'Exempt' },
  '7002': { description: 'School - Private', category: 'Exempt' },
  '7003': { description: 'School - Public', category: 'Exempt' },
  '7004': { description: 'Government - Federal', category: 'Exempt' },
  '7005': { description: 'Government - State', category: 'Exempt' },
  '7006': { description: 'Government - County', category: 'Exempt' },
  '7007': { description: 'Government - Municipal', category: 'Exempt' },
  '7010': { description: 'Cemetery', category: 'Special' },
  '7020': { description: 'Golf Course', category: 'Special' },
  '7030': { description: 'Country Club', category: 'Special' },
  '7040': { description: 'Park/Recreation', category: 'Special' },
  '7050': { description: 'Airport', category: 'Special' },
  '7060': { description: 'Marina', category: 'Special' },
  '7070': { description: 'Nursing Home', category: 'Special' },
  '7080': { description: 'Day Care', category: 'Special' },
  '7090': { description: 'Funeral Home', category: 'Special' },
  
  // 8000 Series - General Commercial
  '8000': { description: 'General Commercial', category: 'Commercial' },
  '8001': { description: 'Commercial Improved - Standard', category: 'Commercial' },
  '8002': { description: 'Commercial Improved - Quality', category: 'Commercial' },
  '8003': { description: 'Commercial - Mixed Use', category: 'Commercial' },
  '8010': { description: 'Strip Center', category: 'Commercial' },
  '8020': { description: 'Convenience Store', category: 'Commercial' },
  '8030': { description: 'Fast Food Restaurant', category: 'Commercial' },
  '8040': { description: 'Auto Repair/Service', category: 'Commercial' },
  '8050': { description: 'Parking Lot/Garage', category: 'Commercial' },
  '8060': { description: 'Bar/Nightclub', category: 'Commercial' },
  '8070': { description: 'Laundromat', category: 'Commercial' },
  '8080': { description: 'Veterinary Clinic', category: 'Commercial' },
  '8090': { description: 'Commercial Condo', category: 'Commercial' },
  
  // 9000 Series - Utilities/Infrastructure
  '9000': { description: 'Utility', category: 'Utility' },
  '9001': { description: 'Electric Utility', category: 'Utility' },
  '9002': { description: 'Gas Utility', category: 'Utility' },
  '9003': { description: 'Water Utility', category: 'Utility' },
  '9004': { description: 'Sewer/Wastewater', category: 'Utility' },
  '9005': { description: 'Telephone/Communications', category: 'Utility' },
  '9006': { description: 'Railroad', category: 'Utility' },
  '9007': { description: 'Pipeline', category: 'Utility' },
  '9008': { description: 'Cable/Fiber', category: 'Utility' },
  '9010': { description: 'Right of Way', category: 'Utility' },
};

/**
 * Get human-readable description for a Texas State Class Code
 */
export function getStateClassDescription(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  const upperCode = code.toUpperCase().trim();
  return STATE_CLASS_CODES[upperCode]?.description || `Unknown (${code})`;
}

/**
 * Get detailed info for a Texas State Class Code
 */
export function getStateClassInfo(code: string | null | undefined): StateClassInfo | null {
  if (!code) return null;
  const upperCode = code.toUpperCase().trim();
  return STATE_CLASS_CODES[upperCode] || null;
}

/**
 * Get human-readable description for a Land Use Code
 */
export function getLandUseDescription(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  const trimmedCode = code.trim();
  return LAND_USE_CODES[trimmedCode]?.description || `Code ${code}`;
}

/**
 * Get detailed info for a Land Use Code
 */
export function getLandUseInfo(code: string | null | undefined): LandUseInfo | null {
  if (!code) return null;
  const trimmedCode = code.trim();
  return LAND_USE_CODES[trimmedCode] || null;
}

/**
 * Get Tailwind color classes for a category
 */
export function getCategoryColorClasses(category: StateClassInfo['category']): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case 'Residential':
      return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' };
    case 'Commercial':
      return { bg: 'bg-[hsl(var(--feasibility-orange)/0.1)]', text: 'text-[hsl(var(--feasibility-orange))]', border: 'border-[hsl(var(--feasibility-orange)/0.3)]' };
    case 'Industrial':
      return { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' };
    case 'Agricultural':
      return { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' };
    case 'Exempt':
      return { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' };
    case 'Utility':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' };
  }
}

/**
 * Get development implications based on property category
 */
export function getDevelopmentImplications(category: StateClassInfo['category']): string {
  switch (category) {
    case 'Residential':
      return 'Property is classified for residential use. Commercial development may require rezoning.';
    case 'Commercial':
      return 'Property supports commercial uses including retail, office, and service establishments.';
    case 'Industrial':
      return 'Property is zoned for manufacturing, warehousing, or heavy commercial uses.';
    case 'Agricultural':
      return 'Property has agricultural exemptions. Development may trigger rollback taxes.';
    case 'Exempt':
      return 'Property is tax-exempt. Change of use may result in taxable status.';
    case 'Utility':
      return 'Property is designated for utility infrastructure and services.';
    default:
      return 'Consult local zoning for permitted uses.';
  }
}
