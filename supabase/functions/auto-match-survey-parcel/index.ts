import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchRequest {
  survey_upload_id: string;
}

interface ExtractedData {
  apn: string | null;
  recording_number: string | null;
  address: string | null;
  county: string | null;
  raw_text: string;
  extraction_source: string;
  ocr_used: boolean;
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

// ============================================================
// Google Cloud Vision OCR
// ============================================================
async function performOCR(imageBase64: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
  if (!apiKey) {
    console.log("[OCR] No GOOGLE_CLOUD_VISION_API_KEY found, skipping OCR");
    return "";
  }

  try {
    console.log("[OCR] Calling Google Cloud Vision API...");
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
// PDF Processing - Extract text layer or trigger OCR
// ============================================================
async function extractTextFromPdfBlob(blob: Blob, supabase: any, storagePath: string): Promise<{ text: string; ocrUsed: boolean }> {
  // First, try to extract text layer from PDF
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Simple text extraction from PDF bytes (works for text-layer PDFs)
  let text = "";
  try {
    // Decode as UTF-8 text and look for readable text streams
    const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    
    // Extract text between stream/endstream markers (simplified PDF text extraction)
    const streamMatches = rawText.matchAll(/stream\s*([\s\S]*?)\s*endstream/g);
    for (const match of streamMatches) {
      const streamContent = match[1];
      // Filter to only printable ASCII chars
      const printable = streamContent.replace(/[^\x20-\x7E\n\r]/g, " ");
      if (printable.length > 20) {
        text += printable + " ";
      }
    }
    
    // Also try direct text extraction (some PDFs have uncompressed text)
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
  
  // Clean up extracted text
  text = text.replace(/\s+/g, " ").trim();
  console.log("[PDF] Text layer extraction got", text.length, "characters");
  
  // If we got meaningful text (more than 100 chars with some letters), use it
  const hasLetters = (text.match(/[A-Za-z]/g) || []).length;
  if (text.length > 100 && hasLetters > 20) {
    console.log("[PDF] Using text layer (found meaningful content)");
    return { text, ocrUsed: false };
  }
  
  // Otherwise, this is likely a scanned PDF - try OCR
  console.log("[PDF] Text layer insufficient, attempting OCR on first page...");
  
  // For OCR, we need to convert PDF page to image
  // Since we can't render PDF in Deno, we'll send the raw bytes to Vision API
  // and see if it can extract text from the PDF header/metadata or embedded images
  
  // Convert the entire blob to base64 for Vision API
  const base64 = btoa(String.fromCharCode(...bytes));
  const ocrText = await performOCR(base64);
  
  if (ocrText.length > 50) {
    console.log("[PDF] OCR extracted", ocrText.length, "characters");
    return { text: ocrText, ocrUsed: true };
  }
  
  // If PDF OCR didn't work, return whatever text we got
  console.log("[PDF] OCR did not improve results, using text layer");
  return { text, ocrUsed: false };
}

// ============================================================
// Smart Reference Classification
// ============================================================
interface ClassifiedReference {
  value: string;
  type: "APN" | "RECORDING_NUMBER" | "UNKNOWN";
  confidence: number;
  source: string;
}

function classifyReferences(text: string, filename: string): ClassifiedReference[] {
  const references: ClassifiedReference[] = [];
  const upperText = text.toUpperCase();
  
  // Pattern 1: Explicit APN/Account/Parcel ID labels (high confidence)
  const apnLabelPatterns = [
    /(?:APN|PARCEL\s*(?:ID|NO|NUMBER)?|ACCOUNT\s*(?:NO|NUMBER)?|PROPERTY\s*ID|HCAD|FBCAD|MCAD)[:\s#]*([A-Z0-9\-\.]{8,15})/gi,
    /(?:TAX\s*(?:ID|PARCEL))[:\s#]*([A-Z0-9\-\.]{8,15})/gi,
  ];
  
  for (const pattern of apnLabelPatterns) {
    const matches = [...upperText.matchAll(pattern)];
    for (const match of matches) {
      const value = match[1]?.replace(/[^A-Z0-9]/g, "");
      if (value && value.length >= 8 && value.length <= 15) {
        references.push({
          value,
          type: "APN",
          confidence: 0.95,
          source: "labeled_apn"
        });
      }
    }
  }
  
  // Pattern 2: Recording/Document numbers (medium-low confidence for APN matching)
  const recordingPatterns = [
    /(?:DOCUMENT|DOC|RECORDING|RECORDED\s*PLAT|FILE|CLERK['']?S?\s*FILE)\s*(?:NO|NUMBER|#)?[:\s]*(\d{5,8})/gi,
    /(?:PLAT\s*RECORDED)[:\s]*(\d{5,8})/gi,
    /(?:VOLUME|VOL)\.?\s*\d+\s*(?:PAGE|PG)\.?\s*\d+/gi, // Vol/Page references
  ];
  
  for (const pattern of recordingPatterns) {
    const matches = [...upperText.matchAll(pattern)];
    for (const match of matches) {
      const value = match[1]?.replace(/[^0-9]/g, "");
      if (value && value.length >= 5 && value.length <= 8) {
        references.push({
          value,
          type: "RECORDING_NUMBER",
          confidence: 0.3, // Low confidence for parcel matching
          source: "recording_number"
        });
      }
    }
  }
  
  // Pattern 3: Standalone long numbers (10-15 digits) - likely APNs
  const longNumberPattern = /\b(\d{10,15})\b/g;
  const longMatches = [...upperText.matchAll(longNumberPattern)];
  for (const match of longMatches) {
    const value = match[1];
    // Avoid duplicates
    if (!references.some(r => r.value === value)) {
      references.push({
        value,
        type: "APN",
        confidence: 0.75,
        source: "long_number"
      });
    }
  }
  
  // Pattern 4: Common APN format 123-456-789 or similar
  const dashPattern = /\b(\d{3,5}[-\.]\d{3,5}[-\.]\d{3,5})\b/g;
  const dashMatches = [...upperText.matchAll(dashPattern)];
  for (const match of dashMatches) {
    const value = match[1].replace(/[^0-9]/g, "");
    if (!references.some(r => r.value === value)) {
      references.push({
        value,
        type: "APN",
        confidence: 0.85,
        source: "dash_format"
      });
    }
  }
  
  // Pattern 5: Filename extraction (high confidence if formatted properly)
  const filenamePatterns = [
    /\((\d{5,15})\)/,           // (679486)
    /(?:plat|doc|file|survey)\s*#?\s*(\d{5,15})/i,  // Plat 679486
    /-(\d{6,15})-/,            // -679486-
    /_(\d{6,15})_/,            // _679486_
    /^(\d{8,15})/,             // Starts with numbers
  ];
  
  for (const pattern of filenamePatterns) {
    const match = filename.match(pattern);
    if (match && match[1]) {
      const value = match[1];
      const len = value.length;
      
      // Short numbers (5-7 digits) from filename are likely recording numbers
      // Longer numbers (10+) are more likely APNs
      if (len >= 10) {
        references.push({
          value,
          type: "APN",
          confidence: 0.85,
          source: "filename_long"
        });
      } else if (len >= 5 && len <= 8) {
        references.push({
          value,
          type: "RECORDING_NUMBER",
          confidence: 0.4,
          source: "filename_short"
        });
      }
    }
  }
  
  // Sort by confidence descending
  references.sort((a, b) => b.confidence - a.confidence);
  
  // Remove duplicates, keeping highest confidence
  const seen = new Set<string>();
  return references.filter(r => {
    if (seen.has(r.value)) return false;
    seen.add(r.value);
    return true;
  });
}

// ============================================================
// Address Extraction
// ============================================================
function extractAddress(text: string): string | null {
  const upperText = text.toUpperCase();
  
  const addressPatterns = [
    // Labeled addresses
    /(?:SITUS|PROPERTY\s*ADDRESS|SITE\s*ADDRESS|LOCATION|STREET\s*ADDRESS)[:\s]*(\d+\s+[A-Z0-9\s]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BLVD|BOULEVARD|WAY|CIRCLE|CIR|COURT|CT|PLACE|PL|PKWY|PARKWAY|HWY|HIGHWAY)[,.\s]*(?:[A-Z\s]*\d{5})?)/gi,
    // Unlabeled street addresses
    /\b(\d+\s+(?:[NSEW]\s+)?[A-Z][A-Z0-9\s]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BLVD|BOULEVARD|WAY|CIRCLE|CIR|COURT|CT|PLACE|PL|PKWY|PARKWAY|HWY|HIGHWAY))\b/gi,
  ];
  
  for (const pattern of addressPatterns) {
    const matches = [...upperText.matchAll(pattern)];
    if (matches.length > 0) {
      const address = matches[0][1]?.trim();
      if (address && address.length > 10) {
        return address;
      }
    }
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
  
  // Also check for just county name
  for (const county of TEXAS_COUNTIES) {
    if (upperText.includes(county)) {
      return county;
    }
  }
  
  return null;
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

    const { survey_upload_id } = await req.json() as MatchRequest;

    if (!survey_upload_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing survey_upload_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[auto-match] ========== Processing survey: ${survey_upload_id} ==========`);

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
    console.log("[auto-match] Storage path:", survey.storage_path);
    console.log("[auto-match] Survey county:", survey.county);

    // Initialize extracted data
    const extractedData: ExtractedData = {
      apn: null,
      recording_number: null,
      address: null,
      county: survey.county || null,
      raw_text: "",
      extraction_source: "none",
      ocr_used: false,
    };

    // ============================================================
    // Step 1: Download and analyze PDF (ALWAYS attempt this)
    // ============================================================
    let pdfText = "";
    let ocrUsed = false;
    
    if (survey.storage_path) {
      console.log("[auto-match] Step 1: Downloading PDF from 'surveys' bucket...");
      
      try {
        // Use the correct bucket name: "surveys" (not "survey-uploads")
        const { data: fileData, error: fileError } = await supabase.storage
          .from("surveys")
          .download(survey.storage_path);

        if (fileError) {
          console.error("[auto-match] Failed to download PDF:", fileError.message);
          console.log("[auto-match] Trying alternate path without leading slash...");
          
          // Try removing leading slash if present
          const altPath = survey.storage_path.replace(/^\//, "");
          const { data: altFileData, error: altFileError } = await supabase.storage
            .from("surveys")
            .download(altPath);
            
          if (altFileError) {
            console.error("[auto-match] Alternate path also failed:", altFileError.message);
          } else if (altFileData) {
            console.log("[auto-match] Downloaded via alternate path, size:", altFileData.size, "bytes");
            const result = await extractTextFromPdfBlob(altFileData, supabase, altPath);
            pdfText = result.text;
            ocrUsed = result.ocrUsed;
          }
        } else if (fileData) {
          console.log("[auto-match] Downloaded PDF, size:", fileData.size, "bytes");
          const result = await extractTextFromPdfBlob(fileData, supabase, survey.storage_path);
          pdfText = result.text;
          ocrUsed = result.ocrUsed;
        }
      } catch (downloadError) {
        console.error("[auto-match] PDF download error:", downloadError);
      }
    }

    extractedData.raw_text = pdfText.substring(0, 5000);
    extractedData.ocr_used = ocrUsed;
    extractedData.extraction_source = ocrUsed ? "ocr" : (pdfText.length > 100 ? "pdf_text" : "filename");

    // ============================================================
    // Step 2: Classify all extracted references
    // ============================================================
    console.log("[auto-match] Step 2: Classifying references from text and filename...");
    
    const allReferences = classifyReferences(pdfText + " " + (survey.title || ""), filename);
    console.log("[auto-match] Found references:", JSON.stringify(allReferences.slice(0, 5)));
    
    // Pick the best APN candidate
    const apnCandidates = allReferences.filter(r => r.type === "APN");
    const recordingNumbers = allReferences.filter(r => r.type === "RECORDING_NUMBER");
    
    if (apnCandidates.length > 0) {
      extractedData.apn = apnCandidates[0].value;
      console.log("[auto-match] Best APN candidate:", extractedData.apn, "confidence:", apnCandidates[0].confidence);
    }
    
    if (recordingNumbers.length > 0) {
      extractedData.recording_number = recordingNumbers[0].value;
      console.log("[auto-match] Recording number found:", extractedData.recording_number);
    }

    // ============================================================
    // Step 3: Extract address
    // ============================================================
    extractedData.address = extractAddress(pdfText) || extractAddress(survey.title || "");
    if (extractedData.address) {
      console.log("[auto-match] Address extracted:", extractedData.address);
    }

    // ============================================================
    // Step 4: Extract/confirm county
    // ============================================================
    if (!extractedData.county) {
      extractedData.county = extractCounty(pdfText);
    }
    console.log("[auto-match] County:", extractedData.county);

    // Update status to matching
    await supabase
      .from("survey_uploads")
      .update({ 
        match_status: "matching",
        extraction_json: extractedData
      })
      .eq("id", survey_upload_id);

    // ============================================================
    // Step 5: Query for parcel candidates
    // ============================================================
    console.log("[auto-match] Step 5: Searching for parcel matches...");
    const candidates: CandidateParcel[] = [];

    // Strategy A: Direct APN match (highest priority)
    if (extractedData.apn) {
      console.log("[auto-match] Strategy A: APN match for", extractedData.apn);
      
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
          candidates.push({
            parcel_id: match.parcel_uuid,
            source_parcel_id: match.source_parcel_id,
            confidence: match.match_score,
            reason_codes: [match.match_type],
            situs_address: match.situs_address,
            owner_name: match.owner_name,
            acreage: match.acreage,
            county: match.county,
            geometry: match.geometry,
            debug: {
              apn_extracted: extractedData.apn,
              address_extracted: extractedData.address,
              match_type: match.match_type
            }
          });
        }
      }
    }

    // Strategy B: Address geocode + proximity (if no APN matches)
    if (candidates.length === 0 && extractedData.address) {
      console.log("[auto-match] Strategy B: Address geocode for", extractedData.address);
      
      try {
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
          "geocode-with-cache",
          { body: { address: extractedData.address + (extractedData.county ? ", " + extractedData.county + " County, TX" : ", TX") } }
        );

        if (geocodeError) {
          console.error("[auto-match] Geocode error:", geocodeError);
        } else if (geocodeData?.lat && geocodeData?.lng) {
          console.log("[auto-match] Geocoded to:", geocodeData.lat, geocodeData.lng);
          
          // Create a point geometry for the spatial query
          const pointWkt = `POINT(${geocodeData.lng} ${geocodeData.lat})`;
          
          const { data: addressMatches, error: addrError } = await supabase.rpc(
            "find_parcel_candidates",
            {
              p_county: extractedData.county,
              p_address_point: pointWkt,
              p_limit: 5
            }
          );

          if (addrError) {
            console.error("[auto-match] Address search error:", addrError);
          } else if (addressMatches?.length > 0) {
            console.log("[auto-match] Address search returned", addressMatches.length, "results");
            for (const match of addressMatches) {
              candidates.push({
                parcel_id: match.parcel_uuid,
                source_parcel_id: match.source_parcel_id,
                confidence: match.match_score * 0.9, // Slightly lower than APN match
                reason_codes: [match.match_type, "ADDRESS_GEOCODE"],
                situs_address: match.situs_address,
                owner_name: match.owner_name,
                acreage: match.acreage,
                county: match.county,
                geometry: match.geometry,
                debug: {
                  apn_extracted: extractedData.apn,
                  address_extracted: extractedData.address,
                  match_type: match.match_type
                }
              });
            }
          }
        }
      } catch (geocodeErr) {
        console.error("[auto-match] Geocode function error:", geocodeErr);
      }
    }

    // Strategy C: Try recording number as partial APN (low confidence)
    if (candidates.length === 0 && extractedData.recording_number) {
      console.log("[auto-match] Strategy C: Recording number as partial search:", extractedData.recording_number);
      
      const { data: recMatches, error: recError } = await supabase.rpc(
        "find_parcel_candidates",
        {
          p_county: extractedData.county,
          p_apn: extractedData.recording_number,
          p_limit: 5
        }
      );

      if (!recError && recMatches?.length > 0) {
        console.log("[auto-match] Recording number search returned", recMatches.length, "results");
        for (const match of recMatches) {
          candidates.push({
            parcel_id: match.parcel_uuid,
            source_parcel_id: match.source_parcel_id,
            confidence: match.match_score * 0.5, // Much lower confidence
            reason_codes: [match.match_type, "RECORDING_NUMBER_FALLBACK"],
            situs_address: match.situs_address,
            owner_name: match.owner_name,
            acreage: match.acreage,
            county: match.county,
            geometry: match.geometry,
            debug: {
              apn_extracted: extractedData.apn,
              address_extracted: extractedData.address,
              match_type: "RECORDING_FALLBACK"
            }
          });
        }
      }
    }

    // ============================================================
    // Step 6: Determine final status
    // ============================================================
    let status: "AUTO_SELECTED" | "NEEDS_REVIEW" | "NO_MATCH" = "NO_MATCH";
    let selectedParcelId: string | null = null;
    let topConfidence = 0;

    if (candidates.length > 0) {
      // Sort by confidence descending
      candidates.sort((a, b) => b.confidence - a.confidence);
      topConfidence = candidates[0].confidence;

      if (topConfidence >= 0.85) {
        status = "AUTO_SELECTED";
        selectedParcelId = candidates[0].parcel_id;
        console.log("[auto-match] AUTO_SELECTED parcel:", selectedParcelId);
      } else if (topConfidence >= 0.5) {
        status = "NEEDS_REVIEW";
        console.log("[auto-match] NEEDS_REVIEW - top confidence:", topConfidence);
      } else {
        status = "NEEDS_REVIEW"; // Still show low-confidence candidates for review
        console.log("[auto-match] NEEDS_REVIEW (low confidence) - top:", topConfidence);
      }
    } else {
      console.log("[auto-match] NO_MATCH - no candidates found");
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
        extraction_json: extractedData,
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
          recording_number: extractedData.recording_number,
          address_extracted: extractedData.address,
          county_extracted: extractedData.county,
          ocr_used: extractedData.ocr_used,
          extraction_source: extractedData.extraction_source,
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
