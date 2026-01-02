/**
 * Survey Image Canvas
 * Allows users to mark control points on a survey image
 * with pan/zoom capabilities.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { ControlPointPair } from '@/types/surveyCalibration';

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

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
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
      console.error('Failed to load survey image');
    };
    img.src = imageUrl;
  }, [imageUrl, onImageLoad]);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img || !imageLoaded) return;
    
    // Clear canvas
    ctx.fillStyle = '#1f2937'; // dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw image with transform
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
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
  }, [points, scale, offset, imageLoaded, activePointLabel]);

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
      if (imageX >= 0 && imageX <= imageRef.current.width &&
          imageY >= 0 && imageY <= imageRef.current.height) {
        onPointAdded(imageX, imageY);
      }
    }
  }, [activePointLabel, isPanning, screenToImage, onPointAdded]);

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
      
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading survey...</div>
        </div>
      )}
    </div>
  );
}
