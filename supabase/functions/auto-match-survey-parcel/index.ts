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
  address: string | null;
  county: string | null;
  raw_text: string;
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

// Regex patterns for extracting APN/Parcel IDs
const APN_PATTERNS = [
  /(?:APN|PARCEL\s*(?:ID|NO|NUMBER)?|CAD|ACCOUNT\s*(?:NO|NUMBER)?|PROPERTY\s*ID)[:\s#]*([A-Z0-9\-\.]+)/gi,
  /(?:TAX\s*(?:ID|PARCEL))[:\s#]*([A-Z0-9\-\.]+)/gi,
  /\b(\d{3,}-\d{3,}-\d{3,})\b/g, // Common APN format: 123-456-789
  /\b(\d{6,12})\b/g, // Numeric APN: 6-12 digits
  /(?:DOCUMENT|DOC|RECORDING|PLAT|FILE)\s*(?:NO|NUMBER|#)?[:\s]*(\d{5,})/gi, // Recording/plat numbers
  /(?:HCAD|FBCAD|MCAD)[:\s#]*([A-Z0-9\-]+)/gi, // Texas CAD formats
];

// Regex patterns for extracting addresses
const ADDRESS_PATTERNS = [
  /(?:SITUS|PROPERTY\s*ADDRESS|LOCATION)[:\s]*(\d+\s+[A-Z0-9\s]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BLVD|BOULEVARD|WAY|CIRCLE|CIR|COURT|CT|PLACE|PL)[,.\s]*(?:[A-Z]+)?)/gi,
  /\b(\d+\s+(?:[NSEW]\s+)?[A-Z]+(?:\s+[A-Z]+)*\s+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BLVD|BOULEVARD|WAY|CIRCLE|CIR|COURT|CT|PLACE|PL))\b/gi,
];

// Texas county names for matching
const TEXAS_COUNTIES = [
  "HARRIS", "FORT BEND", "MONTGOMERY", "BRAZORIA", "GALVESTON", 
  "LIBERTY", "CHAMBERS", "WALLER", "AUSTIN", "COLORADO"
];

function extractTextFromPdf(pdfText: string): ExtractedData {
  const text = pdfText.toUpperCase();
  
  // Extract APN
  let apn: string | null = null;
  for (const pattern of APN_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      // Get the first match group
      apn = matches[0][1]?.replace(/[^A-Z0-9]/g, "") || null;
      if (apn && apn.length >= 5) break;
    }
  }

  // Extract address
  let address: string | null = null;
  for (const pattern of ADDRESS_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      address = matches[0][1]?.trim() || null;
      if (address) break;
    }
  }

  // Extract county
  let county: string | null = null;
  for (const countyName of TEXAS_COUNTIES) {
    if (text.includes(countyName)) {
      county = countyName;
      break;
    }
  }

  return { apn, address, county, raw_text: text.substring(0, 1000) };
}

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

    console.log(`[auto-match-survey-parcel] Processing survey: ${survey_upload_id}`);

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
      console.error("[auto-match-survey-parcel] Survey not found:", surveyError);
      return new Response(
        JSON.stringify({ success: false, error: "Survey not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize extracted data
    const extractedData: ExtractedData = {
      apn: null,
      address: null,
      county: survey.county || null,
      raw_text: "",
    };

    // Step 1: Extract reference number from filename (most reliable for plat files)
    const filename = survey.filename || "";
    console.log("[auto-match-survey-parcel] Analyzing filename:", filename);
    
    // Match patterns like "(679486)" or "Plat 679486" in filename
    const filenamePatterns = [
      /\((\d{5,})\)/,           // (679486)
      /(?:plat|doc|file)\s*#?\s*(\d{5,})/i,  // Plat 679486
      /-(\d{6,})-/,            // -679486-
      /_(\d{6,})_/,            // _679486_
    ];
    
    for (const pattern of filenamePatterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        extractedData.apn = match[1];
        console.log("[auto-match-survey-parcel] Extracted reference from filename:", extractedData.apn);
        break;
      }
    }

    // Step 2: Try to download and extract text from PDF if no APN from filename
    if (!extractedData.apn && survey.storage_path) {
      console.log("[auto-match-survey-parcel] Downloading PDF from:", survey.storage_path);
      
      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from("survey-uploads")
          .download(survey.storage_path);

        if (fileError) {
          console.error("[auto-match-survey-parcel] Failed to download PDF:", fileError.message);
        } else if (fileData) {
          // Convert blob to text - works for PDFs with text layer
          const text = await fileData.text();
          extractedData.raw_text = text.substring(0, 5000);
          
          console.log("[auto-match-survey-parcel] PDF text length:", text.length);
          
          // Extract data from PDF text
          const pdfExtracted = extractTextFromPdf(text);
          extractedData.apn = extractedData.apn || pdfExtracted.apn;
          extractedData.address = pdfExtracted.address;
          extractedData.county = extractedData.county || pdfExtracted.county;
          
          console.log("[auto-match-survey-parcel] Extracted from PDF:", pdfExtracted);
        }
      } catch (downloadError) {
        console.error("[auto-match-survey-parcel] PDF download error:", downloadError);
      }
    }

    // Step 3: Fallback to title/metadata
    if (!extractedData.apn && survey.title) {
      const titleUpper = survey.title.toUpperCase();
      for (const pattern of APN_PATTERNS) {
        const matches = [...titleUpper.matchAll(pattern)];
        if (matches.length > 0) {
          extractedData.apn = matches[0][1]?.replace(/[^A-Z0-9]/g, "") || null;
          if (extractedData.apn && extractedData.apn.length >= 5) break;
        }
      }
    }
    
    if (!extractedData.address && survey.title) {
      const titleUpper = survey.title.toUpperCase();
      for (const pattern of ADDRESS_PATTERNS) {
        const matches = [...titleUpper.matchAll(pattern)];
        if (matches.length > 0) {
          extractedData.address = matches[0][1]?.trim() || null;
          break;
        }
      }
    }

    console.log("[auto-match-survey-parcel] Final extracted data:", extractedData);

    // Update status to matching
    await supabase
      .from("survey_uploads")
      .update({ 
        match_status: "matching",
        extraction_json: extractedData
      })
      .eq("id", survey_upload_id);

    // Query for parcel candidates using the RPC function
    const candidates: CandidateParcel[] = [];

    // Strategy 1: Direct APN match
    if (extractedData.apn) {
      console.log("[auto-match-survey-parcel] Strategy 1: APN match for", extractedData.apn);
      
      const { data: apnMatches, error: apnError } = await supabase.rpc(
        "find_parcel_candidates",
        {
          p_county: extractedData.county,
          p_apn: extractedData.apn,
          p_limit: 5
        }
      );

      if (!apnError && apnMatches?.length > 0) {
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

    // Strategy 2: Address geocode + proximity (if no APN matches or low confidence)
    if (candidates.length === 0 && extractedData.address) {
      console.log("[auto-match-survey-parcel] Strategy 2: Address match for", extractedData.address);
      
      // Use existing geocode function
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke(
        "geocode-with-cache",
        { body: { address: extractedData.address } }
      );

      if (!geocodeError && geocodeData?.lat && geocodeData?.lng) {
        // Query parcels near this point
        const { data: addressMatches, error: addrError } = await supabase.rpc(
          "find_parcel_candidates",
          {
            p_county: extractedData.county,
            p_address_point: `POINT(${geocodeData.lng} ${geocodeData.lat})`,
            p_limit: 5
          }
        );

        if (!addrError && addressMatches?.length > 0) {
          for (const match of addressMatches) {
            candidates.push({
              parcel_id: match.parcel_uuid,
              source_parcel_id: match.source_parcel_id,
              confidence: match.match_score,
              reason_codes: [match.match_type, "ADDRESS"],
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
    }

    // Strategy 3: County-only fallback (lowest confidence)
    if (candidates.length === 0 && extractedData.county) {
      console.log("[auto-match-survey-parcel] Strategy 3: County fallback for", extractedData.county);
      
      // Just note that we couldn't find a specific match
      // Don't populate random parcels from the county
    }

    // Determine final status
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
      } else {
        status = "NEEDS_REVIEW";
      }
    }

    console.log("[auto-match-survey-parcel] Final status:", status, "candidates:", candidates.length, "topConfidence:", topConfidence);

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
        match_candidates: candidates,
        match_reason_codes: candidates[0]?.reason_codes || [],
      })
      .eq("id", survey_upload_id);

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
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[auto-match-survey-parcel] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
