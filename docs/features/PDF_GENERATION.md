# PDF Generation Implementation Guide

This document covers three approaches to PDF generation in Supabase Edge Functions.

---

## 1. Direct HTML + jsPDF (Client-Side)

### Concept
Render HTML content in the Edge Function and use jsPDF to convert it into a PDF.

### Pros
- Simple to implement for basic layouts
- No external dependencies beyond jsPDF

### Cons
- Limited layout control compared to server-side solutions
- Complex layouts can be difficult to achieve
- Client-side rendering may impact performance

### Implementation

```typescript
import { jsPDF } from "jspdf";

// Sample HTML content
const htmlContent = `
  <h1>Hello, PDF!</h1>
  <p>This is a simple PDF generated using jsPDF.</p>
`;

// Initialize jsPDF
const pdf = new jsPDF();

// Add HTML content to PDF
pdf.html(htmlContent, {
  callback: (doc) => {
    // Save the PDF
    doc.save("output.pdf");
  },
});
```

### Considerations
- Ensure HTML content is simple and compatible with jsPDF
- Handle fonts and styling carefully for consistent rendering

---

## 2. HTML + Puppeteer (Server-Side)

### Concept
Use Puppeteer to render HTML content in a headless Chrome instance and generate a PDF.

### Pros
- Full control over layout and styling with CSS
- Supports modern web standards and JavaScript
- Server-side rendering ensures consistent output

### Cons
- Requires more resources and setup compared to jsPDF
- May have performance overhead for complex layouts

### Implementation

```typescript
import puppeteer from 'puppeteer';

async function generatePdf(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}

// Example usage
const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Puppeteer PDF</title>
    <style>
      body { font-size: 16px; }
      h1 { color: navy; }
    </style>
  </head>
  <body>
    <h1>Hello, Puppeteer PDF!</h1>
    <p>This is a PDF generated using Puppeteer.</p>
  </body>
  </html>
`;

// Generate PDF
const pdfBuffer = await generatePdf(htmlContent);

// Return PDF as response
return new Response(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="output.pdf"',
  },
});
```

### Considerations
- Ensure Puppeteer is correctly configured in the Edge Function environment
- Optimize HTML and CSS for efficient rendering
- Handle error cases and timeouts gracefully

---

## 3. JSON Data + Templating Engine (Server-Side)

### Concept
Use a templating engine like Handlebars or Mustache to generate HTML from JSON data, then convert it to PDF using Puppeteer.

### Pros
- Decouples data from presentation
- Allows for dynamic content generation
- Simplifies complex layouts with reusable templates

### Cons
- Requires more setup and complexity compared to direct HTML approaches
- Templating logic can become complex for advanced use cases

### Implementation

```typescript
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

// Sample JSON data
const data = {
  title: 'Feasibility Study',
  propertyAddress: '123 Main St, Anytown',
  reportDate: '2024-11-08',
  sections: [
    { title: 'Executive Summary', content: 'This is a summary of the feasibility study.' },
    { title: 'Property Overview', content: 'Details about the property.' },
  ],
};

// Handlebars template
const templateString = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>{{title}}</title>
    <style>
      body { font-family: sans-serif; }
      h1 { color: #333; }
      .section { margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>{{title}}</h1>
    <p><strong>Property:</strong> {{propertyAddress}}</p>
    <p><strong>Date:</strong> {{reportDate}}</p>
    {{#each sections}}
      <div class="section">
        <h2>{{title}}</h2>
        <p>{{content}}</p>
      </div>
    {{/each}}
  </body>
  </html>
`;

async function generatePdfFromJson(data: any, templateString: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Compile Handlebars template
  const template = handlebars.compile(templateString);

  // Generate HTML from data and template
  const htmlContent = template(data);

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}

// Generate PDF
const pdfBuffer = await generatePdfFromJson(data, templateString);

// Return PDF as response
return new Response(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="report.pdf"',
  },
});
```

### Considerations
- Choose a templating engine that fits your needs and complexity
- Design templates for flexibility and maintainability
- Handle data validation and error cases in the templating logic

---

## 4. Key Implementation Details

### 4.1. Supabase Edge Function Setup

Ensure your Supabase Edge Function is configured to handle PDF generation:

- **Dependencies**: Include necessary packages (e.g., `puppeteer`, `handlebars`) in `supabase/functions/your-function/package.json`.
- **Permissions**: Grant necessary permissions to the Edge Function to access external resources (e.g., network access for Puppeteer).
- **Memory**: Allocate sufficient memory to the Edge Function for PDF generation, especially for complex layouts.

### 4.2. Font Handling

Consistent font rendering is crucial for professional-looking PDFs. Consider these strategies:

- **Web Fonts**: Use Google Fonts or other web font providers and include them in your HTML templates.
- **Base64 Encoding**: Embed font files directly in your CSS using base64 encoding.
- **System Fonts**: Rely on system fonts available in the Edge Function environment (less portable but simpler).

### 4.3. Error Handling and Logging

Implement robust error handling and logging to diagnose and resolve PDF generation issues:

- **Try-Catch Blocks**: Wrap PDF generation logic in try-catch blocks to handle exceptions.
- **Logging**: Use `console.log` or a dedicated logging library to record errors and diagnostic information.
- **User Feedback**: Provide informative error messages to users when PDF generation fails.

### 4.4. Security Considerations

- **Input Sanitization**: Sanitize all input data to prevent injection attacks, especially when using templating engines.
- **Resource Limits**: Enforce resource limits (e.g., memory, execution time) to prevent denial-of-service attacks.
- **Secure Dependencies**: Keep dependencies up-to-date to address security vulnerabilities.

### 4.5. Performance Optimization

- **Caching**: Cache generated PDFs to reduce the load on the Edge Function and improve response times.
- **Compression**: Compress PDF files to reduce storage and bandwidth costs.
- **Parallelization**: Parallelize PDF generation tasks to improve throughput.

---

## 5. Example: Feasibility Report PDF Generation

This example demonstrates how to generate a feasibility report PDF using JSON data, Handlebars templating, and Puppeteer.

### 5.1. Data Model

```typescript
interface FeasibilityReport {
  title: string;
  propertyAddress: string;
  reportDate: string;
  executiveSummary: string;
  sections: {
    title: string;
    content: string;
    citations: string[];
  }[];
  score: number;
  band: string;
}
```

### 5.2. Handlebars Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
  <style>
    body { font-family: sans-serif; }
    h1 { color: #333; }
    .section { margin-bottom: 20px; }
    .citation { font-size: 0.8em; color: #777; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p><strong>Property:</strong> {{propertyAddress}}</p>
  <p><strong>Date:</strong> {{reportDate}}</p>
  <p><strong>Executive Summary:</strong> {{executiveSummary}}</p>
  <h2>Report Sections</h2>
  {{#each sections}}
    <div class="section">
      <h3>{{title}}</h3>
      <p>{{content}}</p>
      {{#each citations}}
        <p class="citation">Citation: {{this}}</p>
      {{/each}}
    </div>
  {{/each}}
  <h2>Feasibility Score: {{score}} ({{band}})</h2>
</body>
</html>
```

### 5.3. Edge Function Code

```typescript
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

// Sample JSON data (replace with your actual data)
const reportData: FeasibilityReport = {
  title: 'Feasibility Study for 123 Main St',
  propertyAddress: '123 Main St, Anytown',
  reportDate: '2024-11-08',
  executiveSummary: 'This report assesses the feasibility of developing a commercial property at 123 Main St.',
  sections: [
    {
      title: 'Zoning Analysis',
      content: 'The property is zoned for commercial use, allowing for a variety of development options.',
      citations: ['City Zoning Ordinance Section 4.2'],
    },
    {
      title: 'Environmental Assessment',
      content: 'A Phase I environmental assessment revealed no significant environmental concerns.',
      citations: ['Phase I Environmental Report dated 2024-10-01'],
    },
  ],
  score: 85,
  band: 'High Feasibility',
};

// Handlebars template (defined above)
const templateString = `<!DOCTYPE html>...</html>`;

async function generateFeasibilityReportPdf(reportData: FeasibilityReport, templateString: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Compile Handlebars template
  const template = handlebars.compile(templateString);

  // Generate HTML from data and template
  const htmlContent = template(reportData);

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}

// Generate PDF
const pdfBuffer = await generateFeasibilityReportPdf(reportData, templateString);

// Return PDF as response
return new Response(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="feasibility-report.pdf"',
  },
});
```

### 5.4. Deployment

1.  **Create Supabase Edge Function**: Create a new Edge Function in your Supabase project.
2.  **Install Dependencies**: Add `puppeteer` and `handlebars` to your `package.json` file and run `npm install`.
3.  **Deploy Function**: Deploy the Edge Function to Supabase.
4.  **Test**: Invoke the Edge Function with sample data and verify that the PDF is generated correctly.

---

By following these guidelines and examples, you can implement robust and scalable PDF generation in your Supabase Edge Functions.
