# PDF Generation Implementation Guide

This document covers three approaches to PDF generation in Supabase Edge Functions.

---

## Option 1: External PDF Service (Recommended for Quick Setup)

### Services to Consider:
- **PDFShift** (https://pdfshift.io) - $29/month for 1,000 PDFs
- **API2PDF** (https://www.api2pdf.com) - Pay as you go
- **HTML to PDF API** (https://htmlpdfapi.com) - Free tier available

### Implementation:

```typescript
// supabase/functions/generate-pdf/index.ts

async function convertHTMLtoPDF(html: string): Promise<Uint8Array> {
  const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY');
  
  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(pdfShiftApiKey + ':')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: html,
      sandbox: false,
      format: 'Letter',
      margin: {
        top: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
        right: '0.75in'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PDF generation failed: ${error}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}
```

### Setup Steps:
1. Sign up for PDFShift (or alternative)
2. Add API key to Supabase secrets:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add `PDFSHIFT_API_KEY`
3. Deploy the function

---

## Option 2: Puppeteer in Docker (Free, More Control)

Puppeteer requires Chrome/Chromium, which needs a custom Docker container.

### Create Dockerfile:

```dockerfile
# supabase/functions/generate-pdf/Dockerfile
FROM denoland/deno:1.37.0

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DENO_DEPLOYMENT_ID=local

WORKDIR /app
COPY . .

CMD ["deno", "run", "--allow-all", "index.ts"]
```

### Updated Edge Function:

```typescript
// supabase/functions/generate-pdf/index.ts
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

async function convertHTMLtoPDF(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: Deno.env.get('PUPPETEER_EXECUTABLE_PATH') || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport and content
    await page.setViewport({ width: 816, height: 1056 }); // Letter size
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      },
      printBackground: true,
      preferCSSPageSize: false,
    });
    
    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
```

### Deployment:
This requires custom Docker deployment which is complex with Supabase. Consider using Option 1 or 3 instead.

---

## Option 3: jsPDF (Lightweight, Limited Formatting)

For simple PDFs without complex layouts:

```typescript
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

async function convertHTMLtoPDF(html: string): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  // Note: jsPDF has limited HTML support
  // You'll need to manually construct the PDF or use html2canvas
  
  // Example: Simple text-based PDF
  doc.setFontSize(24);
  doc.text('BuildSmarter™ Feasibility Report', 1, 1);
  
  doc.setFontSize(12);
  doc.text('Generated: ' + new Date().toLocaleDateString(), 1, 1.5);
  
  // Add more content...
  
  const pdfBytes = doc.output('arraybuffer');
  return new Uint8Array(pdfBytes);
}
```

---

## Recommended Approach: External Service

For BuildSmarter, I recommend **Option 1 (External PDF Service)** because:

1. ✅ **Easy setup** - Just add an API key
2. ✅ **Reliable** - Professional PDF rendering
3. ✅ **Scalable** - Handles complex HTML/CSS
4. ✅ **Low maintenance** - No Docker containers
5. ✅ **Cost-effective** - ~$0.03 per PDF

### Next Steps:

1. Choose a service (PDFShift recommended)
2. Sign up and get API key
3. Add API key to Supabase secrets
4. I'll update the generate-pdf function with the actual implementation

Would you like me to implement Option 1 with PDFShift?
