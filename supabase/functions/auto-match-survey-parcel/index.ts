import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// Types
// ============================================================
interface MatchRequest {
  survey_upload_id: string;
  ocr_image_base64?: string; // Pre-rendered first page from client
}

type SurveyType = "LAND_TITLE_SURVEY" | "RECORDED_PLAT" | "BOUNDARY_ONLY" | "UNKNOWN";

interface ExtractedData {
  apn: string | null;
  address: string | null;
  county: string | null;
  ownerName: string | null;
  acreage: number | null;
  legalDescription: {
    lot: string | null;
    block: string | null;
    subdivision: string | null;
  } | null;
  surveyType: SurveyType;
  rawText: string;
  extractionSource: string;
  ocrUsed: boolean;
}

interface CandidateParcel {
  parcel_id: string;
  source_parcel_id: string;
  confidence: number;
  reason_codes: string[];
  situs_address: string | null;
  owner_name: string | null;
  acreage: number | null;
  county: string;
  geometry: object | null;
  debug: {
    apn_extracted: string | null;
    address_extracted: string | null;
    match_type: string;
  };
}

// Texas county names for matching
const TEXAS_COUNTIES = [
  "HARRIS", "FORT BEND", "MONTGOMERY", "BRAZORIA", "GALVESTON", 
  "LIBERTY", "CHAMBERS", "WALLER", "AUSTIN", "COLORADO"
];

// APN Keywords - only extract numbers as APNs if near these
const APN_KEYWORDS = [
  "APN", "ACCOUNT", "PARCEL ID", "PARCEL NO", "PARCEL NUMBER",
  "CAD", "HCAD", "FBCAD", "MCAD", "TAX ID", "PROPERTY ID",
  "ACCT", "ACCOUNT NO", "ACCOUNT NUMBER"
];

// ============================================================
// Survey Type Classifier
// ============================================================
function classifySurvey(text: string, extractedData: Partial<ExtractedData>): SurveyType {
  const upperText = text.toUpperCase();
  
  // Check for address pattern (number + street name)
  const hasAddress = extractedData.address && /^\d+\s+[A-Z]/i.test(extractedData.address);
  
  // Check for legal description elements
  const hasLegalDesc = /\bLOT\s+\d+|\bBLOCK\s+[A-Z0-9]+|\bSUBDIVISION\b/i.test(upperText);
  
  // LAND_TITLE_SURVEY: Has address + legal description
  if (hasAddress && hasLegalDesc) {
    console.log("[Classifier] LAND_TITLE_SURVEY - has address and legal description");
    return "LAND_TITLE_SURVEY";
  }
  
  // RECORDED_PLAT: "Recorded Plat" or "Subdivision of X acres", no address, may have owner
  const isPlat = /RECORDED\s*PLAT|PLAT\s*OF|SUBDIVISION\s*OF\s*[\d.]+\s*ACRES|PLAT\s*RECORD/i.test(upperText);
  if (isPlat && !hasAddress) {
    console.log("[Classifier] RECORDED_PLAT - plat keywords, no address");
    return "RECORDED_PLAT";
  }
  
  // BOUNDARY_ONLY: Has bearings/distances but no address and no owner
  const hasBearings = /[NS]\s*\d+[°']\s*\d+|\bBEARING\b|\bN\s*\d+\s*DEG\s*\d+/i.test(upperText);
  if (hasBearings && !hasAddress && !extractedData.ownerName) {
    console.log("[Classifier] BOUNDARY_ONLY - bearings only");
    return "BOUNDARY_ONLY";
  }
  
  console.log("[Classifier] UNKNOWN - no clear classification");
  return "UNKNOWN";
}

// ============================================================
// Google Cloud Vision OCR
// ============================================================
async function performOCR(imageBase64: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
  if (!apiKey) {
    console.log("[OCR] No GOOGLE_CLOUD_VISION_API_KEY found, skipping OCR");
    return "";
  }

  // Log API key info for debugging (first/last 4 chars only)
  const keyPreview = apiKey.length > 8 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` 
    : "***";
  console.log(`[OCR] Using API key: ${keyPreview} (length: ${apiKey.length})`);

  try {
    console.log("[OCR] Calling Google Cloud Vision API with image (" + imageBase64.length + " chars)...");
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[OCR] Vision API error:", response.status, errorText);
      return "";
    }

    const result = await response.json();
    const text = result.responses?.[0]?.fullTextAnnotation?.text || "";
    console.log("[OCR] Extracted", text.length, "characters via OCR");
    return text;
  } catch (error) {
    console.error("[OCR] Error calling Vision API:", error);
    return "";
  }
}

// ============================================================
// PDF Text Layer Extraction (fallback when no client OCR image)
// ============================================================
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  let text = "";
  try {
    const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    
    // Extract text between stream/endstream markers
    const streamMatches = rawText.matchAll(/stream\s*([\s\S]*?)\s*endstream/g);
    for (const match of streamMatches) {
      const streamContent = match[1];
      const printable = streamContent.replace(/[^\x20-\x7E\n\r]/g, " ");
      if (printable.length > 20) {
        text += printable + " ";
      }
    }
    
    // Direct text extraction
    const textObjects = rawText.matchAll(/\(([^)]+)\)/g);
    for (const match of textObjects) {
      const obj = match[1];
      if (obj.length > 3 && /[A-Za-z0-9]/.test(obj)) {
        text += obj + " ";
      }
    }
  } catch (e) {
    console.log("[PDF] Text layer extraction failed:", e);
  }
  
  return text.replace(/\s+/g, " ").trim();
}

// ============================================================
// APN Extraction (Keyword-Anchored Only)
// ============================================================
function extractAPNWithKeyword(text: string): { apn: string; confidence: number } | null {
  const upperText = text.toUpperCase();
  
  for (const keyword of APN_KEYWORDS) {
    // Look for keyword followed by a number
    const pattern = new RegExp(keyword.replace(/\s+/g, "\\s*") + "[:\\s#]*([A-Z0-9\\-]{8,15})", "gi");
    const match = pattern.exec(upperText);
    if (match && match[1]) {
      const apn = match[1].replace(/[^A-Z0-9]/gi, "");
      if (apn.length >= 8 && apn.length <= 15) {
        console.log("[APN] Found keyword-anchored APN:", apn, "via keyword:", keyword);
        return { apn, confidence: 0.95 };
      }
    }
  }
  
  // Also check for dashed format near keywords
  const dashPattern = /\b(\d{3,5}[-\.]\d{3,5}[-\.]\d{3,5})\b/g;
  const dashMatches = [...upperText.matchAll(dashPattern)];
  for (const match of dashMatches) {
    const apn = match[1].replace(/[^0-9]/g, "");
    if (apn.length >= 8 && apn.length <= 15) {
      console.log("[APN] Found dashed-format APN:", apn);
      return { apn, confidence: 0.85 };
    }
  }
  
  return null;
}

// ============================================================
// Address Extraction
// ============================================================
function extractAddress(text: string): string | null {
  const upperText = text.toUpperCase();
  
  // Legal description terms that should NOT appear in street addresses
  const legalTerms = [' AC ', ' ACRE', 'TRACT ', 'BLOCK ', 'LOT ', 'SECTION ', 'ABSTRACT '];
  
  const addressPatterns = [
    // Labeled addresses (highest priority)
    /(?:SITUS|PROPERTY\s*ADDRESS|SITE\s*ADDRESS|LOCATION|STREET\s*ADDRESS)[:\s]*(\d+\s+[A-Z0-9\s]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BLVD|BOULEVARD|WAY|CIRCLE|CIR|COURT|CT|PLACE|PL|PKWY|PARKWAY|HWY|HIGHWAY))/gi,
    // Unlabeled street addresses - must have at least 2 alpha chars before street suffix
    /\b(\d{1,6}\s+(?:[NSEW]\s+)?(?:[A-Z]{2,}\s+)+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BLVD|BOULEVARD|WAY|CIRCLE|CIR|COURT|CT|PLACE|PL|PKWY|PARKWAY|HWY|HIGHWAY)(?:\s+(?:SOUTH|NORTH|EAST|WEST|S|N|E|W))?)\b/gi,
  ];
  
  for (const pattern of addressPatterns) {
    const matches = [...upperText.matchAll(pattern)];
    for (const match of matches) {
      let address = match[1]?.trim();
      if (address && address.length > 10) {
        // Clean up the address
        address = address.replace(/\s+/g, " ").trim();
        
        // Reject addresses containing legal description terms
        const hasLegalTerm = legalTerms.some(term => address.includes(term));
        if (hasLegalTerm) {
          console.log("[Address] Rejected (contains legal description term):", address);
          continue;
        }
        
        console.log("[Address] Extracted valid address:", address);
        return address;
      }
    }
  }
  
  console.log("[Address] No valid address found in text");
  return null;
}

// ============================================================
// Owner Name Extraction
// ============================================================
function extractOwnerName(text: string): string | null {
  const patterns = [
    /OWNER[:\s]+([A-Z][A-Z\s&,.']+?)(?:LLC|LP|INC|CORP|$|\n)/gi,
    /PREPARED\s+FOR[:\s]+([A-Z][A-Z\s&,.']+?)(?:LLC|LP|INC|CORP|$|\n)/gi,
    /PROPERTY\s+OF[:\s]+([A-Z][A-Z\s&,.']+?)(?:LLC|LP|INC|CORP|$|\n)/gi,
    /SURVEYED\s+FOR[:\s]+([A-Z][A-Z\s&,.']+?)(?:LLC|LP|INC|CORP|$|\n)/gi,
    /CLIENT[:\s]+([A-Z][A-Z\s&,.']+?)(?:LLC|LP|INC|CORP|$|\n)/gi,
  ];
  
  const upperText = text.toUpperCase();
  
  for (const pattern of patterns) {
    const match = pattern.exec(upperText);
    if (match && match[1]) {
      let owner = match[1].trim();
      // Clean up and validate
      owner = owner.replace(/\s+/g, " ").replace(/[,.']+$/, "").trim();
      if (owner.length >= 3 && owner.length <= 100) {
        console.log("[Owner] Extracted owner name:", owner);
        return owner;
      }
    }
  }
  
  return null;
}

// ============================================================
// Acreage Extraction
// ============================================================
function extractAcreage(text: string): number | null {
  const patterns = [
    /(\d+\.?\d*)\s*(?:ACRES?|AC\.?)\b/gi,
    /CONTAINING\s+(\d+\.?\d*)\s*(?:ACRES?|AC)/gi,
    /AREA[:\s]+(\d+\.?\d*)\s*(?:ACRES?|AC)/gi,
  ];
  
  const upperText = text.toUpperCase();
  
  for (const pattern of patterns) {
    const match = pattern.exec(upperText);
    if (match && match[1]) {
      const acreage = parseFloat(match[1]);
      if (acreage > 0 && acreage < 10000) { // Reasonable range
        console.log("[Acreage] Extracted acreage:", acreage);
        return acreage;
      }
    }
  }
  
  return null;
}

// ============================================================
// Legal Description Extraction
// ============================================================
function extractLegalDescription(text: string): { lot: string | null; block: string | null; subdivision: string | null } | null {
  const upperText = text.toUpperCase();
  
  const lot = upperText.match(/\bLOT\s+(\d+[A-Z]?)\b/i)?.[1] || null;
  const block = upperText.match(/\bBLOCK\s+([A-Z0-9]+)\b/i)?.[1] || null;
  
  // Try to extract subdivision name
  let subdivision: string | null = null;
  const subdivPatterns = [
    /(?:SUBDIVISION|ADDN|ADDITION)\s+(?:OF\s+)?([A-Z][A-Z\s]+?)(?:,|\n|BLOCK|LOT|SECTION)/i,
    /([A-Z][A-Z\s]+?)\s+(?:SUBDIVISION|ADDN|ADDITION)/i,
  ];
  
  for (const pattern of subdivPatterns) {
    const match = upperText.match(pattern);
    if (match && match[1]) {
      subdivision = match[1].trim();
      if (subdivision.length >= 3 && subdivision.length <= 60) {
        break;
      }
      subdivision = null;
    }
  }
  
  if (lot || block || subdivision) {
    console.log("[Legal] Extracted legal desc - Lot:", lot, "Block:", block, "Subdivision:", subdivision);
    return { lot, block, subdivision };
  }
  
  return null;
}

// ============================================================
// County Extraction
// ============================================================
function extractCounty(text: string): string | null {
  const upperText = text.toUpperCase();
  
  for (const county of TEXAS_COUNTIES) {
    if (upperText.includes(county + " COUNTY") || upperText.includes("COUNTY OF " + county)) {
      return county;
    }
  }
  
  // Fallback: just county name
  for (const county of TEXAS_COUNTIES) {
    if (upperText.includes(county)) {
      return county;
    }
  }
  
  return null;
}

// ============================================================
// County Extraction from Filename
// ============================================================
function extractCountyFromFilename(filename: string): string | null {
  const upper = filename.toUpperCase();
  
  // Direct county name matches
  for (const county of TEXAS_COUNTIES) {
    if (upper.includes(county)) {
      console.log("[County] Extracted from filename:", county);
      return county;
    }
  }
  
  // City-to-county mappings for Houston area
  const cityMappings: Record<string, string> = {
    "HOUSTON": "HARRIS",
    "SUGAR LAND": "FORT BEND",
    "SUGARLAND": "FORT BEND",
    "KATY": "HARRIS", // Could be Fort Bend too
    "PEARLAND": "BRAZORIA",
    "LEAGUE CITY": "GALVESTON",
    "THE WOODLANDS": "MONTGOMERY",
    "WOODLANDS": "MONTGOMERY",
    "CONROE": "MONTGOMERY",
    "CYPRESS": "HARRIS",
    "HUMBLE": "HARRIS",
    "SPRING": "HARRIS",
    "PASADENA": "HARRIS",
    "BAYTOWN": "HARRIS",
    "MISSOURI CITY": "FORT BEND",
    "RICHMOND": "FORT BEND",
    "ROSENBERG": "FORT BEND",
    "FRIENDSWOOD": "GALVESTON",
    "TEXAS CITY": "GALVESTON",
    "GALVESTON": "GALVESTON",
    "ANGLETON": "BRAZORIA",
    "FREEPORT": "BRAZORIA",
    "CLUTE": "BRAZORIA",
  };
  
  for (const [city, county] of Object.entries(cityMappings)) {
    if (upper.includes(city)) {
      console.log("[County] Derived from city in filename:", city, "->", county);
      return county;
    }
  }
  
  return null;
}

// ============================================================
// Scanned PDF Detection
// ============================================================
function isPdfScanned(pdfText: string): boolean {
  if (pdfText.length < 50) return true; // Almost no text = likely scanned
  
  // Count readable vs garbage characters
  const readable = pdfText.replace(/[^a-zA-Z0-9\s.,;:'"()-]/g, "").length;
  const ratio = readable / pdfText.length;
  
  console.log("[PDF] Readable ratio:", ratio.toFixed(2), "(readable:", readable, "/ total:", pdfText.length, ")");
  
  // Less than 30% readable = likely scanned/image-based
  return ratio < 0.3;
}

// ============================================================
// Main Handler
// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { survey_upload_id, ocr_image_base64 } = await req.json() as MatchRequest;

    if (!survey_upload_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing survey_upload_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[auto-match] ========== Processing survey: ${survey_upload_id} ==========`);
    console.log(`[auto-match] Client OCR image provided: ${ocr_image_base64 ? "Yes (" + ocr_image_base64.length + " chars)" : "No"}`);

    // Update status to analyzing
    await supabase
      .from("survey_uploads")
      .update({ match_status: "analyzing" })
      .eq("id", survey_upload_id);

    // Fetch the survey record
    const { data: survey, error: surveyError } = await supabase
      .from("survey_uploads")
      .select("*")
      .eq("id", survey_upload_id)
      .single();

    if (surveyError || !survey) {
      console.error("[auto-match] Survey not found:", surveyError);
      return new Response(
        JSON.stringify({ success: false, error: "Survey not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filename = survey.filename || "";
    console.log("[auto-match] Filename:", filename);
    console.log("[auto-match] Survey county from metadata:", survey.county);

    // Initialize extracted data
    const extractedData: ExtractedData = {
      apn: null,
      address: null,
      county: survey.county || null,
      ownerName: null,
      acreage: null,
      legalDescription: null,
      surveyType: "UNKNOWN",
      rawText: "",
      extractionSource: "none",
      ocrUsed: false,
    };

    // ============================================================
    // Step 1: Get text content (prefer client OCR image, fallback to PDF text layer)
    // ============================================================
    let textContent = "";
    
    if (ocr_image_base64) {
      // Client provided a pre-rendered image - use OCR on it
      console.log("[auto-match] Step 1: Using client-provided OCR image");
      textContent = await performOCR(ocr_image_base64);
      extractedData.ocrUsed = true;
      extractedData.extractionSource = "client_ocr";
    }
    
    // If OCR didn't produce enough text, try PDF text layer
    if (textContent.length < 100 && survey.storage_path) {
      console.log("[auto-match] Step 1b: Trying PDF text layer extraction");
      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from("surveys")
          .download(survey.storage_path);

        if (!fileError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const pdfText = extractTextFromPdfBytes(bytes);
          
          if (pdfText.length > textContent.length) {
            textContent = pdfText;
            extractedData.extractionSource = "pdf_text";
          }
        }
      } catch (e) {
        console.log("[auto-match] PDF download/extraction failed:", e);
      }
    }
    
    extractedData.rawText = textContent.substring(0, 5000);
    console.log("[auto-match] Text content length:", textContent.length, "Source:", extractedData.extractionSource);

    // ============================================================
    // Step 2: Extract all fields
    // ============================================================
    console.log("[auto-match] Step 2: Extracting fields from text...");
    
    // APN (keyword-anchored only)
    const apnResult = extractAPNWithKeyword(textContent);
    if (apnResult) {
      extractedData.apn = apnResult.apn;
    }
    
    // Address
    extractedData.address = extractAddress(textContent) || extractAddress(survey.title || "");
    
    // Owner name
    extractedData.ownerName = extractOwnerName(textContent);
    
    // Acreage
    extractedData.acreage = extractAcreage(textContent);
    
    // Legal description
    extractedData.legalDescription = extractLegalDescription(textContent);
    
    // County (from text if not in metadata, then try filename)
    if (!extractedData.county) {
      extractedData.county = extractCounty(textContent);
    }
    if (!extractedData.county) {
      extractedData.county = extractCountyFromFilename(filename);
    }
    
    // Classify survey type
    extractedData.surveyType = classifySurvey(textContent, extractedData);
    
    console.log("[auto-match] Extraction results:", {
      apn: extractedData.apn,
      address: extractedData.address,
      ownerName: extractedData.ownerName,
      acreage: extractedData.acreage,
      legalDescription: extractedData.legalDescription,
      county: extractedData.county,
      surveyType: extractedData.surveyType,
    });

    // Update status to matching
    await supabase
      .from("survey_uploads")
      .update({ 
        match_status: "matching",
        survey_type: extractedData.surveyType,
        extracted_owner_name: extractedData.ownerName,
        extracted_acreage: extractedData.acreage,
        extracted_legal_description: extractedData.legalDescription,
        extraction_json: {
          apn: extractedData.apn,
          address: extractedData.address,
          county: extractedData.county,
          ownerName: extractedData.ownerName,
          acreage: extractedData.acreage,
          legalDescription: extractedData.legalDescription,
          surveyType: extractedData.surveyType,
          ocrUsed: extractedData.ocrUsed,
          extractionSource: extractedData.extractionSource,
        }
      })
      .eq("id", survey_upload_id);

    // ============================================================
    // Step 3: Run matching strategies (independent, parallel-ish)
    // ============================================================
    console.log("[auto-match] Step 3: Running matching strategies...");
    const candidates: CandidateParcel[] = [];

    // Strategy A: Address Match (only for LAND_TITLE_SURVEY with quality address)
    if (extractedData.surveyType === "LAND_TITLE_SURVEY" && extractedData.address && extractedData.address.length > 15) {
      console.log("[auto-match] Strategy A: Address geocode for:", extractedData.address);
      
      try {
        // Build full address string
        const fullAddress = extractedData.address + 
          (extractedData.county ? ", " + extractedData.county + " County" : "") + 
          ", TX";
        
        // FIX: Use correct geocoder API format - query + query_type
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
          "geocode-with-cache",
          { 
            body: { 
              query: fullAddress,
              query_type: "address"
            } 
          }
        );

        if (geocodeError) {
          console.error("[auto-match] Geocode error:", geocodeError);
        } else if (geocodeData?.lat && geocodeData?.lng) {
          console.log("[auto-match] Geocoded to:", geocodeData.lat, geocodeData.lng);
          
          const pointWkt = `POINT(${geocodeData.lng} ${geocodeData.lat})`;
          
          const { data: addressMatches, error: addrError } = await supabase.rpc(
            "find_parcel_candidates",
            {
              p_county: extractedData.county,
              p_address_point: pointWkt,
              p_limit: 5
            }
          );

          if (!addrError && addressMatches?.length > 0) {
            console.log("[auto-match] Address search returned", addressMatches.length, "results");
            for (const match of addressMatches) {
              // Boost confidence if legal description also matches
              let confidence = match.match_score * 0.9;
              const reasonCodes = ["ADDRESS_MATCH"];
              
              if (extractedData.legalDescription && confidence > 0.5) {
                confidence = Math.min(confidence + 0.1, 0.98);
                reasonCodes.push("LEGAL_DESC_MATCH");
              }
              
              candidates.push({
                parcel_id: match.parcel_uuid,
                source_parcel_id: match.source_parcel_id,
                confidence,
                reason_codes: reasonCodes,
                situs_address: match.situs_address,
                owner_name: match.owner_name,
                acreage: match.acreage,
                county: match.county,
                geometry: match.geometry,
                debug: {
                  apn_extracted: extractedData.apn,
                  address_extracted: extractedData.address,
                  match_type: "ADDRESS_GEOCODE"
                }
              });
            }
          }
        }
      } catch (geocodeErr) {
        console.error("[auto-match] Geocode function error:", geocodeErr);
      }
    }

    // Strategy B: Owner Name Match (mandatory for RECORDED_PLAT)
    if (extractedData.ownerName && extractedData.county) {
      console.log("[auto-match] Strategy B: Owner match for:", extractedData.ownerName);
      
      const { data: ownerMatches, error: ownerError } = await supabase.rpc(
        "find_parcels_by_owner",
        {
          p_owner_name: extractedData.ownerName,
          p_county: extractedData.county,
          p_acreage_min: extractedData.acreage ? extractedData.acreage * 0.8 : null,
          p_acreage_max: extractedData.acreage ? extractedData.acreage * 1.2 : null,
          p_limit: 5
        }
      );

      if (ownerError) {
        console.error("[auto-match] Owner search error:", ownerError);
      } else if (ownerMatches?.length > 0) {
        console.log("[auto-match] Owner search returned", ownerMatches.length, "results");
        for (const match of ownerMatches) {
          // Check for duplicates
          if (candidates.some(c => c.parcel_id === match.parcel_uuid)) continue;
          
          // Owner alone never auto-selects, cap at 0.75
          const confidence = Math.min(match.match_score * 0.75, 0.75);
          
          candidates.push({
            parcel_id: match.parcel_uuid,
            source_parcel_id: match.source_parcel_id,
            confidence,
            reason_codes: ["OWNER_MATCH", "COUNTY_MATCH"],
            situs_address: match.situs_address,
            owner_name: match.owner_name,
            acreage: match.acreage,
            county: match.county,
            geometry: match.geometry,
            debug: {
              apn_extracted: extractedData.apn,
              address_extracted: extractedData.address,
              match_type: "OWNER_MATCH"
            }
          });
        }
      }
    }

    // Strategy C: Legal Description Match
    if (extractedData.legalDescription && (extractedData.legalDescription.lot || extractedData.legalDescription.subdivision)) {
      console.log("[auto-match] Strategy C: Legal description match");
      
      const { data: legalMatches, error: legalError } = await supabase.rpc(
        "find_parcels_by_legal_description",
        {
          p_lot: extractedData.legalDescription.lot,
          p_block: extractedData.legalDescription.block,
          p_subdivision: extractedData.legalDescription.subdivision,
          p_county: extractedData.county,
          p_limit: 5
        }
      );

      if (legalError) {
        console.error("[auto-match] Legal desc search error:", legalError);
      } else if (legalMatches?.length > 0) {
        console.log("[auto-match] Legal desc search returned", legalMatches.length, "results");
        for (const match of legalMatches) {
          // Check for duplicates - boost existing if already there
          const existing = candidates.find(c => c.parcel_id === match.parcel_uuid);
          if (existing) {
            existing.confidence = Math.min(existing.confidence + 0.15, 0.98);
            if (!existing.reason_codes.includes("LEGAL_DESC_MATCH")) {
              existing.reason_codes.push("LEGAL_DESC_MATCH");
            }
            continue;
          }
          
          candidates.push({
            parcel_id: match.parcel_uuid,
            source_parcel_id: match.source_parcel_id,
            confidence: match.match_score,
            reason_codes: ["LEGAL_DESC_MATCH"],
            situs_address: match.situs_address,
            owner_name: match.owner_name,
            acreage: match.acreage,
            county: match.county,
            geometry: match.geometry,
            debug: {
              apn_extracted: extractedData.apn,
              address_extracted: extractedData.address,
              match_type: "LEGAL_DESC"
            }
          });
        }
      }
    }

    // Strategy D: APN Match (if we have a keyword-anchored APN)
    if (extractedData.apn) {
      console.log("[auto-match] Strategy D: APN match for:", extractedData.apn);
      
      const { data: apnMatches, error: apnError } = await supabase.rpc(
        "find_parcel_candidates",
        {
          p_county: extractedData.county,
          p_apn: extractedData.apn,
          p_limit: 5
        }
      );

      if (apnError) {
        console.error("[auto-match] APN search error:", apnError);
      } else if (apnMatches?.length > 0) {
        console.log("[auto-match] APN search returned", apnMatches.length, "results");
        for (const match of apnMatches) {
          // Check for duplicates - boost existing
          const existing = candidates.find(c => c.parcel_id === match.parcel_uuid);
          if (existing) {
            existing.confidence = Math.min(existing.confidence + 0.2, 0.98);
            if (!existing.reason_codes.includes("APN_MATCH")) {
              existing.reason_codes.push("APN_MATCH");
            }
            continue;
          }
          
          candidates.push({
            parcel_id: match.parcel_uuid,
            source_parcel_id: match.source_parcel_id,
            confidence: match.match_score,
            reason_codes: ["APN_MATCH"],
            situs_address: match.situs_address,
            owner_name: match.owner_name,
            acreage: match.acreage,
            county: match.county,
            geometry: match.geometry,
            debug: {
              apn_extracted: extractedData.apn,
              address_extracted: extractedData.address,
              match_type: "APN_MATCH"
            }
          });
        }
      }
    }

    // ============================================================
    // Strategy E: Area Fallback (search multiple counties if county unknown)
    // ============================================================
    if (candidates.length === 0 && extractedData.acreage) {
      // If no county, search all Houston-area counties
      const countiesToSearch = extractedData.county 
        ? [extractedData.county] 
        : ["HARRIS", "FORT BEND", "MONTGOMERY", "BRAZORIA", "GALVESTON"];
      
      console.log("[auto-match] Strategy E: Area fallback for acreage:", extractedData.acreage, "in counties:", countiesToSearch.join(", "));
      
      for (const county of countiesToSearch) {
        const { data: areaMatches, error: areaError } = await supabase.rpc(
          "find_parcels_by_area",
          {
            p_county: county,
            p_target_acreage: extractedData.acreage,
            p_tolerance: 0.25,
            p_limit: 3 // Fewer per county when searching multiple
          }
        );

        if (areaError) {
          console.error("[auto-match] Area search error for", county, ":", areaError);
          continue;
        }
        
        if (areaMatches?.length > 0) {
          console.log("[auto-match] Area search in", county, "returned", areaMatches.length, "results");
          for (const match of areaMatches) {
            // Lower confidence when county was unknown (searched multiple)
            const countyKnown = extractedData.county !== null;
            const baseConfidence = countyKnown ? 0.55 : 0.35;
            
            candidates.push({
              parcel_id: match.parcel_uuid,
              source_parcel_id: match.source_parcel_id,
              confidence: Math.min(match.match_score * baseConfidence, countyKnown ? 0.55 : 0.40),
              reason_codes: countyKnown ? ["AREA_MATCH", "COUNTY_MATCH"] : ["AREA_MATCH"],
              situs_address: match.situs_address,
              owner_name: match.owner_name,
              acreage: match.acreage,
              county: match.county,
              geometry: match.geometry,
              debug: {
                apn_extracted: extractedData.apn,
                address_extracted: extractedData.address,
                match_type: countyKnown ? "AREA_FALLBACK" : "AREA_MULTI_COUNTY"
              }
            });
          }
        }
        
        // Stop early if we found enough candidates
        if (candidates.length >= 5) break;
      }
    }

    // ============================================================
    // Step 4: Determine final status with confidence gating
    // ============================================================
    let status: "AUTO_SELECTED" | "NEEDS_REVIEW" | "NO_MATCH" = "NO_MATCH";
    let selectedParcelId: string | null = null;
    let topConfidence = 0;

    if (candidates.length > 0) {
      // Sort by confidence descending
      candidates.sort((a, b) => b.confidence - a.confidence);
      topConfidence = candidates[0].confidence;
      
      // Auto-select ONLY if:
      // 1. Confidence >= 0.85
      // 2. Has at least one deterministic signal (ADDRESS or LEGAL_DESC or APN)
      const topCandidate = candidates[0];
      const hasDeterministicSignal = 
        topCandidate.reason_codes.includes("ADDRESS_MATCH") ||
        topCandidate.reason_codes.includes("LEGAL_DESC_MATCH") ||
        topCandidate.reason_codes.includes("APN_MATCH");
      
      if (topConfidence >= 0.85 && hasDeterministicSignal) {
        status = "AUTO_SELECTED";
        selectedParcelId = topCandidate.parcel_id;
        console.log("[auto-match] AUTO_SELECTED parcel:", selectedParcelId, "confidence:", topConfidence);
      } else {
        status = "NEEDS_REVIEW";
        console.log("[auto-match] NEEDS_REVIEW - confidence:", topConfidence, "deterministic:", hasDeterministicSignal);
      }
    } else {
      // HARD RULE: Never NO_MATCH if we have ANY useful signals
      const hasSignals = extractedData.ownerName || extractedData.acreage || 
                         extractedData.legalDescription || extractedData.address;
      
      // Also check if it's a scanned PDF that we couldn't OCR - user should manually review
      const isScanned = isPdfScanned(extractedData.rawText);
      const noOcrProvided = !extractedData.ocrUsed;
      
      if (hasSignals) {
        console.log("[auto-match] NO_MATCH prevented - has useful signals, downgrading to NEEDS_REVIEW");
        status = "NEEDS_REVIEW";
      } else if (isScanned && noOcrProvided) {
        console.log("[auto-match] NO_MATCH prevented - scanned PDF without OCR, needs manual review");
        status = "NEEDS_REVIEW";
      } else {
        console.log("[auto-match] NO_MATCH - no candidates, no useful signals, not a scanned PDF");
      }
    }

    console.log("[auto-match] Final status:", status, "| Candidates:", candidates.length, "| Top confidence:", topConfidence);

    // Update survey record with results
    const matchStatus = status === "AUTO_SELECTED" ? "matched" 
      : status === "NEEDS_REVIEW" ? "needs_review" 
      : "no_match";

    await supabase
      .from("survey_uploads")
      .update({
        match_status: matchStatus,
        selected_parcel_id: selectedParcelId,
        match_confidence: topConfidence,
        match_candidates: candidates.slice(0, 10),
        match_reason_codes: candidates[0]?.reason_codes || [],
      })
      .eq("id", survey_upload_id);

    console.log("[auto-match] ========== Complete ==========");

    return new Response(
      JSON.stringify({
        success: true,
        status,
        selected_parcel_id: selectedParcelId,
        confidence: topConfidence,
        candidates: candidates.slice(0, 5),
        extraction: {
          apn_extracted: extractedData.apn,
          address_extracted: extractedData.address,
          county_extracted: extractedData.county,
          owner_extracted: extractedData.ownerName,
          acreage_extracted: extractedData.acreage,
          legal_description: extractedData.legalDescription,
          survey_type: extractedData.surveyType,
          ocr_used: extractedData.ocrUsed,
          extraction_source: extractedData.extractionSource,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[auto-match] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
