/**
 * Survey Image Canvas
 * Allows users to mark control points on a survey image or PDF
 * with pan/zoom capabilities.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { ControlPointPair } from '@/types/surveyCalibration';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface SurveyImageCanvasProps {
  imageUrl: string;
  points: ControlPointPair[];
  onPointAdded: (imageX: number, imageY: number) => void;
  onPointRemoved: (pointId: string) => void;
  activePointLabel: string | null;
  onImageLoad?: (width: number, height: number) => void;
}

const POINT_COLORS = {
  A: '#ef4444', // red
  B: '#22c55e', // green
  C: '#3b82f6', // blue
  D: '#f59e0b', // amber
};

export function SurveyImageCanvas({
  imageUrl,
  points,
  onPointAdded,
  onPointRemoved,
  activePointLabel,
  onImageLoad,
}: SurveyImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // PDF-specific state
  const [isPdf, setIsPdf] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Detect file type and load accordingly
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setImageLoaded(false);
    setIsPdf(false);
    setPdfDoc(null);
    
    const loadFile = async () => {
      try {
        console.log('[SurveyImageCanvas] Loading file:', imageUrl.slice(0, 100) + '...');
        
        // Fetch the file
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || blob.type || '';
        const isPdfFile = contentType.includes('pdf') || 
                          imageUrl.toLowerCase().includes('.pdf') ||
                          blob.type === 'application/pdf';
        
        console.log('[SurveyImageCanvas] Content type:', contentType, 'isPDF:', isPdfFile);
        
        if (cancelled) return;
        
        if (isPdfFile) {
          // Handle PDF
          setIsPdf(true);
          const arrayBuffer = await blob.arrayBuffer();
          
          console.log('[SurveyImageCanvas] Loading PDF document...');
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          if (cancelled) return;
          
          console.log('[SurveyImageCanvas] PDF loaded, pages:', pdf.numPages);
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
          
          // Render first page
          await renderPdfPage(pdf, 1, cancelled);
        } else {
          // Handle image
          const blobUrl = URL.createObjectURL(blob);
          
          const img = new Image();
          img.onload = () => {
            if (cancelled) {
              URL.revokeObjectURL(blobUrl);
              return;
            }
            
            console.log('[SurveyImageCanvas] Image loaded:', img.width, 'x', img.height);
            imageRef.current = img;
            setImageLoaded(true);
            onImageLoad?.(img.width, img.height);
            
            // Center and fit image
            if (containerRef.current) {
              const containerWidth = containerRef.current.clientWidth;
              const containerHeight = containerRef.current.clientHeight;
              const scaleX = containerWidth / img.width;
              const scaleY = containerHeight / img.height;
              const fitScale = Math.min(scaleX, scaleY, 1) * 0.9;
              setScale(fitScale);
              setOffset({
                x: (containerWidth - img.width * fitScale) / 2,
                y: (containerHeight - img.height * fitScale) / 2,
              });
            }
          };
          img.onerror = () => {
            if (!cancelled) {
              console.error('[SurveyImageCanvas] Failed to decode image');
              setLoadError('Failed to decode image. If this is a PDF, ensure it uploaded correctly.');
            }
            URL.revokeObjectURL(blobUrl);
          };
          img.src = blobUrl;
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[SurveyImageCanvas] Failed to load file:', err);
          setLoadError(`Failed to load survey: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    };
    
    loadFile();
    
    return () => {
      cancelled = true;
    };
  }, [imageUrl]); // Note: removed onImageLoad from deps to avoid re-renders

  // Render a PDF page to an image
  const renderPdfPage = async (
    pdf: pdfjsLib.PDFDocumentProxy, 
    pageNum: number, 
    cancelled: boolean
  ) => {
    setIsLoadingPage(true);
    
    try {
      const page = await pdf.getPage(pageNum);
      
      // Scale for good resolution (2x for retina-like quality)
      const pdfScale = 2;
      const viewport = page.getViewport({ scale: pdfScale });
      
      // Create offscreen canvas to render PDF
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = viewport.width;
      offscreenCanvas.height = viewport.height;
      const ctx = offscreenCanvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
      
      if (cancelled) return;
      
      // Convert to image
      const dataUrl = offscreenCanvas.toDataURL('image/png');
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to convert PDF page to image'));
        img.src = dataUrl;
      });
      
      if (cancelled) return;
      
      // Use the original PDF dimensions (not scaled)
      const originalViewport = page.getViewport({ scale: 1 });
      
      console.log('[SurveyImageCanvas] PDF page rendered:', originalViewport.width, 'x', originalViewport.height);
      
      imageRef.current = img;
      setImageLoaded(true);
      onImageLoad?.(originalViewport.width, originalViewport.height);
      
      // Center and fit
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        // Note: img dimensions are scaled, so we use original viewport for fitting
        const scaleX = containerWidth / originalViewport.width;
        const scaleY = containerHeight / originalViewport.height;
        const fitScale = Math.min(scaleX, scaleY, 1) * 0.9;
        setScale(fitScale);
        setOffset({
          x: (containerWidth - originalViewport.width * fitScale) / 2,
          y: (containerHeight - originalViewport.height * fitScale) / 2,
        });
      }
    } catch (err) {
      if (!cancelled) {
        console.error('[SurveyImageCanvas] Failed to render PDF page:', err);
        setLoadError(`Failed to render PDF page ${pageNum}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Handle page change for PDFs
  const handlePageChange = useCallback(async (delta: number) => {
    if (!pdfDoc || isLoadingPage) return;
    
    const newPage = Math.max(1, Math.min(totalPages, currentPage + delta));
    if (newPage === currentPage) return;
    
    setCurrentPage(newPage);
    setImageLoaded(false);
    await renderPdfPage(pdfDoc, newPage, false);
  }, [pdfDoc, currentPage, totalPages, isLoadingPage]);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img || !imageLoaded) return;
    
    // Clear canvas
    ctx.fillStyle = '#1f2937'; // dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // For PDF, the image is 2x scaled, so we need to draw it at half size
    const drawScale = isPdf ? scale / 2 : scale;
    
    // Draw image with transform
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(drawScale, drawScale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    // Draw control points
    for (const point of points) {
      const screenX = point.image_x * scale + offset.x;
      const screenY = point.image_y * scale + offset.y;
      const color = POINT_COLORS[point.label as keyof typeof POINT_COLORS] || '#fff';
      
      // Draw crosshair
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX - 12, screenY);
      ctx.lineTo(screenX + 12, screenY);
      ctx.moveTo(screenX, screenY - 12);
      ctx.lineTo(screenX, screenY + 12);
      ctx.stroke();
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(point.label, screenX + 14, screenY - 10);
    }
    
    // Draw cursor hint if actively placing
    if (activePointLabel) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Click to place point ${activePointLabel}`, 10, canvas.height - 10);
    }
  }, [points, scale, offset, imageLoaded, activePointLabel, isPdf]);

  // Resize canvas to container
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        render();
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  // Re-render on changes
  useEffect(() => {
    render();
  }, [render]);

  // Convert screen coords to image coords
  const screenToImage = useCallback((screenX: number, screenY: number) => {
    return {
      imageX: (screenX - offset.x) / scale,
      imageY: (screenY - offset.y) / scale,
    };
  }, [scale, offset]);

  // Handle click to add point
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activePointLabel || isPanning) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { imageX, imageY } = screenToImage(screenX, screenY);
    
    // Check if click is within image bounds
    if (imageRef.current) {
      // For PDF, the actual image dimensions are the original PDF page size
      // The imageRef contains a 2x scaled image, but onImageLoad reported original size
      const maxX = isPdf ? imageRef.current.width / 2 : imageRef.current.width;
      const maxY = isPdf ? imageRef.current.height / 2 : imageRef.current.height;
      
      if (imageX >= 0 && imageX <= maxX && imageY >= 0 && imageY <= maxY) {
        onPointAdded(imageX, imageY);
      }
    }
  }, [activePointLabel, isPanning, screenToImage, onPointAdded, isPdf]);

  // Handle right-click to remove point
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Find if clicked near a point
    for (const point of points) {
      const pointScreenX = point.image_x * scale + offset.x;
      const pointScreenY = point.image_y * scale + offset.y;
      const dist = Math.sqrt((screenX - pointScreenX) ** 2 + (screenY - pointScreenY) ** 2);
      
      if (dist < 15) {
        onPointRemoved(point.id);
        return;
      }
    }
  }, [points, scale, offset, onPointRemoved]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor));
    
    // Zoom towards mouse position
    const scaleChange = newScale / scale;
    setOffset({
      x: mouseX - (mouseX - offset.x) * scaleChange,
      y: mouseY - (mouseY - offset.y) * scaleChange,
    });
    setScale(newScale);
  }, [scale, offset]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-muted/50 rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full ${activePointLabel ? 'cursor-crosshair' : 'cursor-grab'}`}
      />
      
      {/* Zoom controls */}
      <div className="absolute bottom-3 left-3 flex gap-1">
        <button
          onClick={() => setScale(s => Math.min(5, s * 1.2))}
          className="w-8 h-8 bg-background/80 hover:bg-background rounded text-sm font-bold"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.1, s / 1.2))}
          className="w-8 h-8 bg-background/80 hover:bg-background rounded text-sm font-bold"
        >
          −
        </button>
        <span className="px-2 h-8 bg-background/80 rounded text-xs flex items-center">
          {Math.round(scale * 100)}%
        </span>
      </div>
      
      {/* PDF indicator and page controls */}
      {isPdf && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 h-7 bg-background/80 rounded text-xs">
            <FileText className="h-3 w-3" />
            PDF
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => handlePageChange(-1)}
                disabled={currentPage <= 1 || isLoadingPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 h-7 bg-background/80 rounded text-xs flex items-center min-w-[60px] justify-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => handlePageChange(1)}
                disabled={currentPage >= totalPages || isLoadingPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
          <div className="text-destructive text-sm text-center px-4 max-w-sm">{loadError}</div>
        </div>
      )}
      
      {(!imageLoaded && !loadError) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">
            {isLoadingPage ? `Loading page ${currentPage}...` : 'Loading survey...'}
          </div>
        </div>
      )}
    </div>
  );
}
