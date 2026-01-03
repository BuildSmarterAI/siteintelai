/**
 * PDF Renderer Utility
 * Renders the first page of a PDF to a PNG image for OCR
 */

import * as pdfjs from 'pdfjs-dist';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Renders the first page of a PDF file to a base64 PNG string
 * @param file - The PDF file to render
 * @param scale - Scale factor for rendering (default 2.0 for better OCR)
 * @returns Base64 string of the PNG image (without data URL prefix)
 */
export async function renderPdfFirstPage(file: File, scale = 2.0): Promise<string> {
  try {
    console.log('[pdfRenderer] Starting PDF render for:', file.name);
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    console.log('[pdfRenderer] PDF loaded, pages:', pdf.numPages);
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Calculate viewport at the specified scale
    const viewport = page.getViewport({ scale });
    console.log('[pdfRenderer] Viewport size:', viewport.width, 'x', viewport.height);
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }
    
    // Render the page to the canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    console.log('[pdfRenderer] Page rendered to canvas');
    
    // Convert canvas to base64 PNG (strip the data URL prefix)
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    
    console.log('[pdfRenderer] Generated base64 image, length:', base64.length);
    
    // Clean up
    pdf.destroy();
    
    return base64;
  } catch (error) {
    console.error('[pdfRenderer] Error rendering PDF:', error);
    throw error;
  }
}

/**
 * Checks if a file is a PDF that likely needs OCR (scanned document)
 * @param file - The file to check
 * @returns True if the file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
