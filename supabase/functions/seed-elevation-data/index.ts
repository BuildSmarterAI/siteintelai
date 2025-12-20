import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Terrain Tiles configuration (FREE - no API key needed)
const TERRAIN_TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const ZOOM_LEVEL = 14; // ~10m resolution at equator

interface ParcelCentroid {
  id: number;
  lng: number;
  lat: number;
}

interface TileCoord {
  x: number;
  y: number;
  zoom: number;
  pixelX: number;
  pixelY: number;
}

/**
 * Convert lat/lng to tile coordinates and pixel position within tile
 */
function latLngToTilePixel(lat: number, lng: number, zoom: number): TileCoord {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  
  // Calculate pixel position within the 256x256 tile
  const tileX = (lng + 180) / 360 * n;
  const tileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  
  const pixelX = Math.floor((tileX - x) * 256);
  const pixelY = Math.floor((tileY - y) * 256);
  
  return { x, y, zoom, pixelX, pixelY };
}

/**
 * Decode Terrarium elevation from RGB values
 * Formula: elevation_m = (R * 256 + G + B / 256) - 32768
 */
function decodeTerrarium(r: number, g: number, b: number): number {
  const elevationM = (r * 256 + g + b / 256) - 32768;
  return elevationM;
}

/**
 * Fetch and decode elevation from AWS Terrain Tile
 */
async function getElevationFromTile(lat: number, lng: number): Promise<number | null> {
  try {
    const tile = latLngToTilePixel(lat, lng, ZOOM_LEVEL);
    const url = `${TERRAIN_TILE_URL}/${tile.zoom}/${tile.x}/${tile.y}.png`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch tile: ${url} - ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Parse PNG to get pixel data - simplified approach
    // We'll use a canvas-free approach by finding the IDAT chunk and decompressing
    // For simplicity, we use pngjs-like parsing
    const pixelData = await decodePNG(bytes, tile.pixelX, tile.pixelY);
    if (!pixelData) {
      return null;
    }
    
    const elevationM = decodeTerrarium(pixelData.r, pixelData.g, pixelData.b);
    const elevationFt = elevationM * 3.28084;
    
    return Math.round(elevationFt * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error(`Error getting elevation for ${lat}, ${lng}:`, error);
    return null;
  }
}

/**
 * Simple PNG decoder to extract a single pixel's RGB values
 * AWS Terrain tiles are 256x256 RGB PNGs
 */
async function decodePNG(pngData: Uint8Array, pixelX: number, pixelY: number): Promise<{ r: number; g: number; b: number } | null> {
  try {
    // Validate PNG signature
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
      if (pngData[i] !== signature[i]) {
        console.error("Invalid PNG signature");
        return null;
      }
    }
    
    // Parse chunks to find IHDR and IDAT
    let offset = 8;
    let width = 0;
    let height = 0;
    let idatChunks: Uint8Array[] = [];
    
    while (offset < pngData.length) {
      const length = (pngData[offset] << 24) | (pngData[offset + 1] << 16) | 
                     (pngData[offset + 2] << 8) | pngData[offset + 3];
      const type = String.fromCharCode(pngData[offset + 4], pngData[offset + 5], 
                                       pngData[offset + 6], pngData[offset + 7]);
      
      if (type === "IHDR") {
        width = (pngData[offset + 8] << 24) | (pngData[offset + 9] << 16) | 
                (pngData[offset + 10] << 8) | pngData[offset + 11];
        height = (pngData[offset + 12] << 24) | (pngData[offset + 13] << 16) | 
                 (pngData[offset + 14] << 8) | pngData[offset + 15];
      } else if (type === "IDAT") {
        idatChunks.push(pngData.slice(offset + 8, offset + 8 + length));
      } else if (type === "IEND") {
        break;
      }
      
      offset += 12 + length; // 4 (length) + 4 (type) + length + 4 (CRC)
    }
    
    if (width === 0 || idatChunks.length === 0) {
      console.error("Could not parse PNG structure");
      return null;
    }
    
    // Combine IDAT chunks and decompress
    const totalLength = idatChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedIdat = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of idatChunks) {
      combinedIdat.set(chunk, pos);
      pos += chunk.length;
    }
    
    // Use DecompressionStream to inflate zlib data
    const ds = new DecompressionStream("deflate-raw");
    
    // Skip zlib header (2 bytes)
    const zlibData = combinedIdat.slice(2);
    
    const writer = ds.writable.getWriter();
    writer.write(zlibData);
    writer.close();
    
    const reader = ds.readable.getReader();
    const decompressedChunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      decompressedChunks.push(value);
    }
    
    const decompressedLength = decompressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const rawData = new Uint8Array(decompressedLength);
    pos = 0;
    for (const chunk of decompressedChunks) {
      rawData.set(chunk, pos);
      pos += chunk.length;
    }
    
    // Reconstruct image data (PNG filter reconstruction)
    const bytesPerPixel = 3; // RGB
    const scanlineLength = width * bytesPerPixel;
    const imageData = new Uint8Array(width * height * bytesPerPixel);
    
    for (let y = 0; y < height; y++) {
      const rawOffset = y * (scanlineLength + 1);
      const filterType = rawData[rawOffset];
      const scanlineStart = rawOffset + 1;
      const imageOffset = y * scanlineLength;
      
      for (let x = 0; x < scanlineLength; x++) {
        let raw = rawData[scanlineStart + x];
        let left = x >= bytesPerPixel ? imageData[imageOffset + x - bytesPerPixel] : 0;
        let up = y > 0 ? imageData[imageOffset - scanlineLength + x] : 0;
        let upLeft = (y > 0 && x >= bytesPerPixel) ? imageData[imageOffset - scanlineLength + x - bytesPerPixel] : 0;
        
        switch (filterType) {
          case 0: // None
            imageData[imageOffset + x] = raw;
            break;
          case 1: // Sub
            imageData[imageOffset + x] = (raw + left) & 0xFF;
            break;
          case 2: // Up
            imageData[imageOffset + x] = (raw + up) & 0xFF;
            break;
          case 3: // Average
            imageData[imageOffset + x] = (raw + Math.floor((left + up) / 2)) & 0xFF;
            break;
          case 4: // Paeth
            imageData[imageOffset + x] = (raw + paethPredictor(left, up, upLeft)) & 0xFF;
            break;
          default:
            imageData[imageOffset + x] = raw;
        }
      }
    }
    
    // Extract the specific pixel
    const pixelOffset = (pixelY * width + pixelX) * bytesPerPixel;
    return {
      r: imageData[pixelOffset],
      g: imageData[pixelOffset + 1],
      b: imageData[pixelOffset + 2]
    };
  } catch (error) {
    console.error("PNG decode error:", error);
    return null;
  }
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const jurisdiction = body.jurisdiction as string | undefined;
    const batchSize = Math.min(body.batch_size || 100, 500); // Max 500 per call

    console.log(`Seeding elevation data: jurisdiction=${jurisdiction || 'all'}, batch_size=${batchSize}`);

    // Query parcels missing elevation data
    let query = supabase
      .from('canonical_parcels')
      .select('id, centroid')
      .is('elevation_ft', null)
      .not('centroid', 'is', null)
      .limit(batchSize);

    if (jurisdiction) {
      query = query.ilike('jurisdiction', jurisdiction);
    }

    const { data: parcels, error: queryError } = await query;

    if (queryError) {
      console.error("Query error:", queryError);
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!parcels || parcels.length === 0) {
      console.log("No parcels need elevation data");
      return new Response(JSON.stringify({
        processed: 0,
        remaining: 0,
        errors: 0,
        message: "All parcels have elevation data"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${parcels.length} parcels...`);

    // Process parcels and collect elevation data
    const updates: { id: number; elevation_ft: number }[] = [];
    let errors = 0;

    for (const parcel of parcels) {
      try {
        // Extract coordinates from PostGIS centroid (POINT format)
        // The centroid is returned as a GeoJSON-like object or WKT
        let lng: number, lat: number;
        
        if (typeof parcel.centroid === 'string') {
          // WKT format: POINT(-95.123 29.456)
          const match = parcel.centroid.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
          if (!match) {
            console.error(`Invalid centroid format for parcel ${parcel.id}: ${parcel.centroid}`);
            errors++;
            continue;
          }
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        } else if (parcel.centroid && typeof parcel.centroid === 'object') {
          // GeoJSON format
          const coords = (parcel.centroid as any).coordinates;
          if (!coords || coords.length < 2) {
            console.error(`Invalid centroid coordinates for parcel ${parcel.id}`);
            errors++;
            continue;
          }
          lng = coords[0];
          lat = coords[1];
        } else {
          console.error(`Unknown centroid format for parcel ${parcel.id}`);
          errors++;
          continue;
        }

        const elevation = await getElevationFromTile(lat, lng);
        
        if (elevation !== null) {
          updates.push({ id: parcel.id, elevation_ft: elevation });
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`Error processing parcel ${parcel.id}:`, error);
        errors++;
      }
    }

    console.log(`Got ${updates.length} elevations, ${errors} errors`);

    // Batch update parcels with elevation data
    if (updates.length > 0) {
      const now = new Date().toISOString();
      
      // Update in batches of 50 to avoid query size limits
      const updateBatchSize = 50;
      for (let i = 0; i < updates.length; i += updateBatchSize) {
        const batch = updates.slice(i, i + updateBatchSize);
        
        for (const update of batch) {
          const { error: updateError } = await supabase
            .from('canonical_parcels')
            .update({
              elevation_ft: update.elevation_ft,
              elevation_source: 'aws_terrain',
              elevation_sampled_at: now
            })
            .eq('id', update.id);

          if (updateError) {
            console.error(`Failed to update parcel ${update.id}:`, updateError);
            errors++;
          }
        }
      }
    }

    // Count remaining parcels without elevation
    let remainingQuery = supabase
      .from('canonical_parcels')
      .select('id', { count: 'exact', head: true })
      .is('elevation_ft', null)
      .not('centroid', 'is', null);

    if (jurisdiction) {
      remainingQuery = remainingQuery.ilike('jurisdiction', jurisdiction);
    }

    const { count: remaining } = await remainingQuery;

    const result = {
      processed: updates.length,
      remaining: remaining || 0,
      errors,
      message: `Updated ${updates.length} parcels with elevation data`
    };

    console.log("Result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in seed-elevation-data:", error);
    return new Response(JSON.stringify({
      error: error.message,
      processed: 0,
      remaining: -1,
      errors: 1
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
