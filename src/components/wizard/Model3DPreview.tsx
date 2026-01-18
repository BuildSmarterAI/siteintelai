/**
 * Model3DPreview Component
 * Interactive 3D preview of a building model using Google's model-viewer
 */

import { useState, useEffect, useRef } from 'react';
import { useBuildingModel, getModelSignedUrl, type ModelTransform, DEFAULT_TRANSFORM } from '@/hooks/useBuildingModels';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Box, 
  RotateCw, 
  Pause, 
  Play,
  Maximize2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// Ensure model-viewer is loaded
import '@google/model-viewer';

interface Model3DPreviewProps {
  modelId: string | null;
  transform?: ModelTransform;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

export function Model3DPreview({
  modelId,
  transform = DEFAULT_TRANSFORM,
  className,
  showControls = true,
  autoRotate: initialAutoRotate = true,
}: Model3DPreviewProps) {
  const { data: model, isLoading: modelLoading } = useBuildingModel(modelId);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(initialAutoRotate);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelViewerRef = useRef<HTMLElement>(null);

  // Fetch signed URL when model changes
  useEffect(() => {
    if (!model?.glb_storage_path) {
      setSignedUrl(null);
      return;
    }

    let mounted = true;
    setUrlLoading(true);
    setUrlError(null);
    setIsModelLoaded(false);

    getModelSignedUrl(model.glb_storage_path)
      .then((url) => {
        if (mounted) {
          setSignedUrl(url);
          setUrlLoading(false);
          if (!url) {
            setUrlError('Failed to load model URL');
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('[Model3DPreview] Error fetching URL:', err);
          setUrlError('Failed to load model');
          setUrlLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [model?.glb_storage_path]);

  // Handle model-viewer load event
  const handleModelLoad = () => {
    setIsModelLoaded(true);
  };

  // Handle model-viewer error
  const handleModelError = () => {
    console.error('[Model3DPreview] model-viewer error');
    setUrlError('Failed to render 3D model');
  };

  // Toggle auto-rotate
  const toggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    if (modelViewerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        modelViewerRef.current.requestFullscreen?.();
      }
    }
  };

  // Calculate the effective scale for CSS transform
  const effectiveScale = Math.min(transform.scaleX, transform.scaleY, transform.scaleZ);

  if (!modelId) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6',
        className
      )}>
        <Box className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No model selected</p>
      </div>
    );
  }

  if (modelLoading || urlLoading) {
    return (
      <div className={cn('relative rounded-lg overflow-hidden', className)}>
        <Skeleton className="w-full h-full min-h-[200px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading 3D model...
          </div>
        </div>
      </div>
    );
  }

  if (urlError || !signedUrl) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-6',
        className
      )}>
        <AlertCircle className="h-10 w-10 text-destructive/50 mb-2" />
        <p className="text-sm text-destructive">{urlError || 'Model unavailable'}</p>
        {model?.thumbnail_url && (
          <img 
            src={model.thumbnail_url} 
            alt={model.name}
            className="mt-3 rounded-md max-h-24 opacity-50"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-muted/20', className)}>
      {/* Model name badge */}
      {model && (
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 z-10 text-xs bg-background/80 backdrop-blur-sm"
        >
          {model.name}
        </Badge>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={toggleAutoRotate}
            title={isAutoRotating ? 'Pause rotation' : 'Start rotation'}
          >
            {isAutoRotating ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleFullscreen}
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      {!isModelLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Rendering...
          </div>
        </div>
      )}

      {/* Google Model Viewer */}
      <model-viewer
        ref={modelViewerRef as any}
        src={signedUrl}
        alt={model?.name || '3D Building Model'}
        camera-controls
        auto-rotate={isAutoRotating || undefined}
        rotation-per-second="30deg"
        camera-orbit="45deg 55deg 2.5m"
        min-camera-orbit="auto auto auto"
        max-camera-orbit="auto auto auto"
        shadow-intensity="1"
        shadow-softness="0.5"
        exposure="1"
        environment-image="neutral"
        interaction-prompt="none"
        loading="eager"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '200px',
          backgroundColor: 'transparent',
          '--poster-color': 'transparent',
        } as React.CSSProperties}
        onLoad={handleModelLoad}
        onError={handleModelError}
      />

      {/* Dimensions overlay */}
      {model && isModelLoaded && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1">
            <span>
              {Math.round(model.base_width_ft * transform.scaleX)}′ × 
              {Math.round(model.base_depth_ft * transform.scaleY)}′ × 
              {Math.round(model.base_height_ft * transform.scaleZ)}′ H
            </span>
            <span>
              {model.base_stories} {model.base_stories === 1 ? 'story' : 'stories'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
