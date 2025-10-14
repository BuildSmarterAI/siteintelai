import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { report_id, application_id } = await req.json();

    console.log(`[generate-pdf] Starting PDF generation for report: ${report_id}`);

    // 1. Fetch report and application data
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        applications!reports_application_id_fkey (
          *
        )
      `)
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message}`);
    }

    const application = report.applications;
    const jsonData = report.json_data;

    // 2. Validate JSON schema
    if (!jsonData || !jsonData.summary) {
      throw new Error('Invalid report JSON structure');
    }

    // NEW: Step 2.5 - Generate static map composite
    console.log('[generate-pdf] Generating static map...');
    try {
      await supabase.functions.invoke('render-static-map', {
        body: {
          application_id: application.id,
          center: { lat: application.geo_lat, lng: application.geo_lng },
          zoom: 17,
          size: '800x600'
        }
      });
    } catch (err) {
      console.error('[generate-pdf] Static map generation failed:', err);
    }

    // NEW: Step 2.6 - Generate street view images
    console.log('[generate-pdf] Generating street view images...');
    try {
      await supabase.functions.invoke('render-streetview', {
        body: {
          application_id: application.id,
          location: { lat: application.geo_lat, lng: application.geo_lng },
          headings: [0, 90, 180, 270],
          size: '640x400'
        }
      });
    } catch (err) {
      console.error('[generate-pdf] Street view generation failed:', err);
    }

    // NEW: Fetch updated report with assets
    const { data: updatedReport } = await supabase
      .from('reports')
      .select('report_assets')
      .eq('id', report_id)
      .single();

    const reportAssets = updatedReport?.report_assets || {};

    // 3. Generate HTML content
    const htmlContent = generateReportHTML(report, application, jsonData, reportAssets);

    // 4. Convert HTML to PDF using external service (placeholder)
    // In production, you would use Puppeteer or a PDF service
    // For now, we'll store the HTML as a fallback
    const pdfBuffer = await convertHTMLtoPDF(htmlContent);

    // 5. Upload to Supabase Storage
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const filePath = `${year}/${month}/${report_id}/report.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 6. Generate signed URL (72 hours)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, 259200); // 72 hours

    if (signedError) {
      throw new Error(`Signed URL generation failed: ${signedError.message}`);
    }

    // 7. Update report with PDF URL
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        pdf_url: signedUrlData.signedUrl,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', report_id);

    if (updateError) {
      throw new Error(`Report update failed: ${updateError.message}`);
    }

    console.log(`[generate-pdf] PDF generated successfully: ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        report_id,
        pdf_url: signedUrlData.signedUrl,
        file_path: filePath
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[generate-pdf] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateReportHTML(report: any, application: any, jsonData: any, reportAssets: any = {}): string {
  const summary = jsonData.summary || {};
  const zoning = jsonData.zoning || {};
  const flood = jsonData.flood || {};
  const utilities = jsonData.utilities || {};
  const environmental = jsonData.environmental || {};
  const costSchedule = jsonData.cost_schedule || {};

  const scoreBand = report.score_band || 'C';
  const scoreColor = scoreBand === 'A' ? '#10B981' : scoreBand === 'B' ? '#F59E0B' : '#EF4444';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BuildSmarter™ Feasibility Report</title>
  <style>
    @page {
      size: Letter;
      margin: 0.75in;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #0A0F2C;
    }
    
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      padding: 2in;
    }
    
    .logo {
      font-size: 36pt;
      font-weight: bold;
      color: #FF7A00;
      margin-bottom: 48pt;
    }
    
    .score-badge {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: ${scoreColor};
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 48pt auto;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .score-value {
      font-size: 72pt;
      font-weight: bold;
    }
    
    .score-label {
      font-size: 18pt;
      margin-top: 8pt;
    }
    
    h1 {
      font-size: 48pt;
      font-weight: 600;
      color: #0A0F2C;
      margin-bottom: 24pt;
    }
    
    h2 {
      font-size: 32pt;
      font-weight: 600;
      color: #FF7A00;
      margin-top: 36pt;
      margin-bottom: 18pt;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 20pt;
      font-weight: 600;
      color: #0A0F2C;
      margin-top: 24pt;
      margin-bottom: 12pt;
    }
    
    p {
      margin-bottom: 12pt;
      text-align: justify;
    }
    
    .section {
      page-break-inside: avoid;
      margin-bottom: 24pt;
    }
    
    .metadata {
      background: #f8f9fa;
      padding: 12pt;
      border-left: 4pt solid #FF7A00;
      margin: 18pt 0;
    }
    
    .citation {
      font-size: 10pt;
      color: #6c757d;
      margin-top: 12pt;
      padding: 8pt;
      background: #f8f9fa;
      border-radius: 4pt;
    }
    
    ul, ol {
      margin-left: 24pt;
      margin-bottom: 12pt;
    }
    
    li {
      margin-bottom: 6pt;
    }
    
    .footer {
      position: fixed;
      bottom: 0.5in;
      left: 0.75in;
      right: 0.75in;
      text-align: center;
      font-size: 10pt;
      color: #6c757d;
      border-top: 1pt solid #dee2e6;
      padding-top: 12pt;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18pt 0;
    }
    
    th, td {
      padding: 8pt;
      text-align: left;
      border-bottom: 1pt solid #dee2e6;
    }
    
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="logo">BuildSmarter™</div>
    <h1>Feasibility Report</h1>
    
    <div class="score-badge">
      <div class="score-value">${report.feasibility_score}</div>
      <div class="score-label">Grade ${scoreBand}</div>
    </div>
    
    <div class="metadata">
      <p><strong>Property Address:</strong> ${application.formatted_address || 'N/A'}</p>
      <p><strong>Parcel ID:</strong> ${application.parcel_id || 'N/A'}</p>
      <p><strong>County:</strong> ${application.county || 'N/A'}</p>
      <p><strong>Generated:</strong> ${new Date(report.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
      <p><strong>Report ID:</strong> ${report.id}</p>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <h2>Executive Summary</h2>
    <p>${summary.executive_summary || 'No summary available.'}</p>
    
    ${summary.key_opportunities && summary.key_opportunities.length > 0 ? `
      <h3>Key Opportunities</h3>
      <ul>
        ${summary.key_opportunities.map((opp: string) => `<li>${opp}</li>`).join('')}
      </ul>
    ` : ''}
    
    ${summary.key_risks && summary.key_risks.length > 0 ? `
      <h3>Key Risks</h3>
      <ul>
        ${summary.key_risks.map((risk: string) => `<li>${risk}</li>`).join('')}
      </ul>
    ` : ''}
  </div>

  <!-- Zoning Analysis -->
  <div class="section">
    <h2>Zoning Analysis</h2>
    <div class="metadata">
      <p><strong>Zoning Code:</strong> ${application.zoning_code || 'N/A'}</p>
      <p><strong>Overlay District:</strong> ${application.overlay_district || 'None'}</p>
      <p><strong>Component Score:</strong> ${zoning.component_score || 'N/A'}/100</p>
    </div>
    
    <div>${zoning.verdict || '<p>No zoning analysis available.</p>'}</div>
    
    ${zoning.permitted_uses && zoning.permitted_uses.length > 0 ? `
      <h3>Permitted Uses</h3>
      <ul>
        ${zoning.permitted_uses.map((use: string) => `<li>${use}</li>`).join('')}
      </ul>
    ` : ''}
    
    ${zoning.citations && zoning.citations.length > 0 ? `
      <div class="citation">
        <strong>Data Sources:</strong> ${zoning.citations.map((c: any) => c.source).join(', ')}
      </div>
    ` : ''}
  </div>

  <!-- Floodplain Analysis -->
  <div class="section">
    <h2>Floodplain Analysis</h2>
    <div class="metadata">
      <p><strong>FEMA Zone:</strong> ${application.floodplain_zone || 'N/A'}</p>
      <p><strong>Base Flood Elevation:</strong> ${application.base_flood_elevation || 'N/A'} ft</p>
      <p><strong>Site Elevation:</strong> ${application.elevation || 'N/A'} ft</p>
      <p><strong>Component Score:</strong> ${flood.component_score || 'N/A'}/100</p>
    </div>
    
    <div>${flood.verdict || '<p>No flood analysis available.</p>'}</div>
    
    ${flood.citations && flood.citations.length > 0 ? `
      <div class="citation">
        <strong>Data Sources:</strong> ${flood.citations.map((c: any) => c.source).join(', ')}
      </div>
    ` : ''}
  </div>

  <!-- Utilities & Infrastructure -->
  <div class="section">
    <h2>Utilities & Infrastructure</h2>
    <div class="metadata">
      <p><strong>Component Score:</strong> ${utilities.component_score || 'N/A'}/100</p>
    </div>
    
    <div>${utilities.verdict || '<p>No utilities analysis available.</p>'}</div>
    
    ${utilities.citations && utilities.citations.length > 0 ? `
      <div class="citation">
        <strong>Data Sources:</strong> ${utilities.citations.map((c: any) => c.source).join(', ')}
      </div>
    ` : ''}
  </div>

  <!-- Environmental Constraints -->
  <div class="section">
    <h2>Environmental Constraints</h2>
    <div class="metadata">
      <p><strong>Wetlands:</strong> ${application.wetlands_type || 'None detected'}</p>
      <p><strong>Soil Type:</strong> ${application.soil_series || 'N/A'}</p>
      <p><strong>Component Score:</strong> ${environmental.component_score || 'N/A'}/100</p>
    </div>
    
    <div>${environmental.verdict || '<p>No environmental analysis available.</p>'}</div>
    
    ${environmental.citations && environmental.citations.length > 0 ? `
      <div class="citation">
        <strong>Data Sources:</strong> ${environmental.citations.map((c: any) => c.source).join(', ')}
      </div>
    ` : ''}
  </div>

  <!-- Cost & Schedule -->
  <div class="section">
    <h2>Cost & Schedule</h2>
    <div class="metadata">
      <p><strong>Component Score:</strong> ${costSchedule.component_score || 'N/A'}/100</p>
    </div>
    
    <div>${costSchedule.verdict || '<p>No cost & schedule analysis available.</p>'}</div>
  </div>

  <!-- Appendix: Data Sources -->
  <div class="section">
    <h2>Appendix: Data Sources</h2>
    ${jsonData.data_sources && jsonData.data_sources.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Dataset</th>
            <th>Accessed</th>
          </tr>
        </thead>
        <tbody>
          ${jsonData.data_sources.map((source: any) => `
            <tr>
              <td>${source.provider}</td>
              <td>${source.dataset}</td>
              <td>${source.accessed}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p>No data sources recorded.</p>'}
  </div>

  <!-- NEW: Site Visualization Appendix -->
  ${reportAssets.static_map_url ? `
  <div class="section" style="page-break-before: always;">
    <h2>Appendix: Site Visualization</h2>
    
    <div style="margin-bottom: 32pt;">
      <img src="${reportAssets.static_map_url}" 
           alt="Parcel Map with Overlays" 
           style="width: 100%; max-width: 800px; border-radius: 12pt; box-shadow: 0 4pt 16pt rgba(0,0,0,0.1);" />
      <p style="font-size: 10pt; color: #6B7280; margin-top: 8pt; text-align: center;">
        Figure 1: Property boundary (blue), FEMA flood zone (yellow), utilities (orange)
      </p>
    </div>
    
    ${reportAssets.streetview && reportAssets.streetview.length > 0 ? `
      <div>
        <h3 style="margin-bottom: 16pt;">Street View Photos</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16pt;">
          ${reportAssets.streetview.map((sv: any) => `
            <div>
              <img src="${sv.url}" 
                   alt="View ${sv.direction}" 
                   style="width: 100%; border-radius: 8pt;" />
              <p style="text-align: center; font-size: 10pt; margin-top: 4pt; color: #6B7280;">
                ${sv.direction} View (${sv.heading}°)
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '<p style="color: #9CA3AF;">Street View not available for this location.</p>'}
  </div>
  ` : ''}


  <!-- Footer -->
  <div class="footer">
    <p>© ${new Date().getFullYear()} BuildSmarter AI • Generated automatically — buildsmarter.io • Report ID: ${report.id}</p>
  </div>
</body>
</html>
  `.trim();
}

async function convertHTMLtoPDF(html: string): Promise<Uint8Array> {
  const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY');
  
  if (!pdfShiftApiKey) {
    throw new Error('PDFSHIFT_API_KEY environment variable is not set');
  }

  console.log('[generate-pdf] Converting HTML to PDF using PDFShift...');

  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${pdfShiftApiKey}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: html,
      landscape: false,
      use_print: false,
      format: 'Letter',
      margin: {
        top: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
        right: '0.75in'
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[generate-pdf] PDFShift error:', errorText);
    throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
  }

  console.log('[generate-pdf] PDF conversion successful');
  return new Uint8Array(await response.arrayBuffer());
}
