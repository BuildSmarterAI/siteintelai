# BuildSmarter™ Feasibility — Report Generation & PDF Export Specification

**Version:** 1.0  
**Last Updated:** 2025-10-07  
**Prepared by:** BuildSmarter AI Architecture Team

---

## 1. Introduction & Objectives

The Report Generation & PDF Export Specification defines how BuildSmarter™ Feasibility transforms AI-generated JSON outputs into fully formatted, lender-ready PDF reports. The goal is to create consistent, verifiable, and professional deliverables that combine authoritative GIS data, AI analysis, and visual overlays—automatically, within minutes.

### Objectives

- Convert validated `report.ai_json` into an accessible, branded PDF report
- Embed FEMA, ArcGIS, and other dataset citations directly within each section and in a comprehensive appendix
- Ensure alignment with BuildSmarter's visual identity and accessibility standards
- Securely store and distribute the reports via Supabase with versioning and signed URLs

---

## 2. System Overview — Report Generator Pipeline

### Workflow Sequence

1. **Trigger Event**: Once AI processing completes (`job_state = ai → rendering`), the report generation worker initiates
2. **Schema Validation**: The JSON output is validated against `feasibility-report.json` (P13) using the 2020-12 Draft schema
3. **Data Normalization**: Flatten nested arrays (citations, figures) for layout binding
4. **Layout Rendering**: Render content using the standardized layout template (defined in §4)
5. **PDF Composition**: Assemble pages using HTML-to-PDF service or equivalent within Supabase Edge Functions
6. **Storage & Access**: Upload `.pdf` and `.json` to Supabase Storage, generate signed URLs, and update `reports` table with `pdf_url` and `json_data`
7. **OData Exposure**: Expose read-only metadata (FeasibilityScore, ScoreBand, AsOf, etc.) through `/odata/reports`

---

## 3. Report Structure & Composition

Each report is divided into fixed sections for clarity and lender compliance.

| Section | Content Description | Data Source |
|---------|-------------------|-------------|
| **Cover Page** | Project title, address, parcel ID, generation timestamp, Feasibility Score badge (A/B/C) | `reports.*` |
| **Executive Summary** | ≤120-word summary, key findings, overall risk rating | `json_data.summary.executive_summary` |
| **Zoning Analysis** | Base zoning, overlays, constraints, permitted uses | ArcGIS/County CAD |
| **Floodplain Analysis** | FEMA NFHL zone, BFE, historical events, risk assessment | OpenFEMA + NFIP |
| **Utilities & Infrastructure** | Proximity to mains, available connections, ownership | StormwaterUtilities, Force Main |
| **Environmental Constraints** | Wetlands, EPA sites, soils, mitigation guidance | USFWS, EPA, USDA |
| **Cost & Schedule** | Derived from risk weights and complexity | AI weights |
| **Appendix: Data Sources & Citations** | Full list of all datasets, query endpoints, timestamps | `enrichment_metadata` |
| **Appendix: Figures & Maps** | Visual overlays rendered from parcel geometry | GIS layers |

---

## 4. Page Layout & Design Tokens

All visual elements follow BuildSmarter's unified design language.

### Typography

- **H1**: 48 pt / 56 pt, SemiBold — Section titles
- **H2**: 32 pt / 40 pt, SemiBold — Subheadings
- **Body L**: 18 pt / 28 pt, Regular — Main text
- **Body S**: 14 pt / 22 pt — Data tables and citations

### Color Tokens

| Element | Color (HEX) | Role |
|---------|------------|------|
| **Primary Accent** | #FF7A00 | Headings, progress, highlights |
| **Secondary Accent** | #0A0F2C | Background, borders |
| **Success** | #10B981 | Feasibility "A" |
| **Warning** | #F59E0B | Feasibility "B" |
| **Error** | #EF4444 | Feasibility "C" |

---

## 5. Data Mapping & Citation Embedding

Each dataset referenced by the AI pipeline is embedded at two levels:

### Inline Citation

Displayed at the end of each section:

```
Data Source: OpenFEMA NFIP Multiple Loss Properties
Endpoint: https://www.fema.gov/api/open/v1/NfipMultipleLossProperties
As of: 2025-10-04T05:08Z
```

### Appendix Mapping

| Dataset | Endpoint | Query | As of | Last Refresh |
|---------|----------|-------|-------|--------------|
| HCAD Parcels | `.../FeatureServer/4/query` | parcel intersect | 2025-10-04T21:37Z | — |
| OpenFEMA | https://hazards.fema.gov | panel | 2025-10-04T21:37Z | 2025-10-04T05:08Z |

**Footer**: © BuildSmarter AI + "Generated automatically — buildsmarter.io"

### Compliance

All citations follow OpenFEMA's terms: include dataset name, API endpoint, query parameters, and `lastDataSetRefresh` when present.

---

## 6. Automation Flow & Edge Function Triggers

### Edge Function: `generate-pdf`

**Input:**
```typescript
{
  application_id: string,
  report_id: string
}
```

**Process:**
1. Pull `applications` + `enrichment_metadata` data
2. Validate `json_data` schema
3. Call `generatePDF()` with normalized context
4. Write `.pdf` to Supabase Storage
5. Update `reports.status='completed'` and `reports.pdf_url`

**Pseudo-Code:**
```typescript
await validateSchema(json_data, 'feasibility-report.json')
const pdfBuffer = await renderPDF(json_data, application)
const filePath = `${year}/${month}/${report_id}/report.pdf`
await supabase.storage.from('reports').upload(filePath, pdfBuffer)
const { data } = await supabase.storage.from('reports').createSignedUrl(filePath, 259200) // 72 hours
await supabase.from('reports').update({ 
  pdf_url: data.signedUrl, 
  status: 'completed' 
}).eq('id', report_id)
```

### Failure Handling

- Retry ×3 on storage or rendering failure
- If invalid JSON schema, generate "Minimal Viable PDF" (cover + summary + missing data flags)
- All errors logged to `reports.error_message`

---

## 7. Supabase Storage & Access Control

### Bucket: `reports`

**Structure:**
```
/reports/{year}/{month}/{report_id}/
  ├── report.pdf
  ├── report.json
  └── manifest.json
```

### Retention Policy

- 365 days for Pro users
- 730 days for Enterprise

### Access Control

- Public access disabled
- Signed URLs valid for 72 hours
- `reports.pdf_url` stores pre-signed link with expiry metadata

### Audit

Every signed URL request logs `user_id`, IP, and timestamp.

---

## 8. Error Handling & Validation

| Error Type | Handling Mechanism | Flag |
|-----------|-------------------|------|
| Schema Validation Failed | Retry with corrected JSON prompt | `schema_retry_failed` |
| Missing Data Source | Render section with "Data unavailable" note | `data_flags[]` |
| ArcGIS Timeout | Retries with exponential backoff (×3) | `arcgis_timeout` |
| PDF Rendering Error | Generate fallback text-only PDF | `render_fallback_used` |

All data flags are persisted to `reports.data_flags` for analytics.

---

## 9. Accessibility & Compliance

- **PDF/UA-1** compliance for screen readers
- **WCAG 2.1 AA** color contrast ratios
- Semantic heading structure (H1 → H2 → H3)
- Alternative text for all figures and maps
- Embedded metadata for document title, author, creation date

---

## 10. Example File Structure & API Calls

### File Hierarchy

```
supabase/storage/reports/2025/10/abcd1234/
├── report.pdf
├── report.json
└── manifest.json
```

### Example Download API

```http
GET /reports/abcd1234.pdf
Authorization: Bearer <token>
→ 302 Redirect to signed Supabase URL
```

### Example OData Query

```http
GET /odata/reports?
  $select=id,FeasibilityScore,address,county
  &$filter=FeasibilityScore ge 80
```

---

## 11. Future Enhancements & Versioning

### Planned Additions

- **Template Versioning**: Tag each report with `template_version` and schema version (v1.0 → v1.1)
- **Multilingual Export**: Add `locale` field to allow bilingual feasibility outputs (EN/ES)
- **Map Vector Export**: Option to export layered `.geojson` within report zip bundle
- **API Webhooks**: Notify connected apps (e.g., lenders, CRMs) on report completion
- **AI Revalidation Service**: Compare old reports against updated FEMA datasets (`lastDataSetRefresh` delta)

---

## Implementation Notes

### Technology Stack

- **PDF Generation**: HTML-to-PDF using Puppeteer in Supabase Edge Functions
- **Template Engine**: HTML/CSS templates with data binding
- **Storage**: Supabase Storage with RLS policies
- **Signed URLs**: 72-hour expiry with automatic regeneration

### Performance Requirements

- PDF generation: < 30 seconds
- File size: < 5 MB per report
- Concurrent generation: Up to 10 reports simultaneously

### Security

- All PDF URLs are signed and time-limited
- RLS policies ensure users can only access their own reports
- Admin role can access all reports for support purposes
- Audit logs for all PDF downloads
