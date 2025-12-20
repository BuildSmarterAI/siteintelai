import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mountain, Maximize2, Minimize2, RotateCcw, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElevationMapCardProps {
  latitude: number;
  longitude: number;
  elevation?: number | null;
  parcelGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  className?: string;
}

export function ElevationMapCard({
  latitude,
  longitude,
  elevation,
  parcelGeometry,
  className
}: ElevationMapCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre map with terrain
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors"
          },
          terrain: {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15
          }
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [longitude, latitude],
      zoom: 15,
      pitch: 45,
      bearing: -17.6,
      maxPitch: 85
    });

    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      "top-right"
    );

    map.current.on("load", () => {
      if (!map.current) return;
      setMapLoaded(true);

      // Add hillshade layer
      map.current.addLayer({
        id: "hillshade",
        type: "hillshade",
        source: "terrain",
        paint: {
          "hillshade-exaggeration": 0.5,
          "hillshade-shadow-color": "hsl(229, 67%, 11%)",
          "hillshade-highlight-color": "hsl(0, 0%, 100%)",
          "hillshade-accent-color": "hsl(189, 94%, 43%)"
        }
      });

      // Enable 3D terrain
      map.current.setTerrain({
        source: "terrain",
        exaggeration: 1.5
      });

      // Add parcel boundary if available
      if (parcelGeometry) {
        map.current.addSource("parcel", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: parcelGeometry,
            properties: {}
          }
        });

        map.current.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          paint: {
            "fill-color": "hsl(27, 100%, 50%)",
            "fill-opacity": 0.15
          }
        });

        map.current.addLayer({
          id: "parcel-outline",
          type: "line",
          source: "parcel",
          paint: {
            "line-color": "hsl(27, 100%, 50%)",
            "line-width": 3,
            "line-opacity": 0.9
          }
        });
      }

      // Add site marker
      new maplibregl.Marker({
        color: "#FF7A00"
      })
        .setLngLat([longitude, latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <div class="font-semibold text-sm">Site Location</div>
              ${elevation ? `<div class="text-xs text-gray-600">Elevation: ${elevation.toFixed(1)} ft</div>` : ""}
            </div>`
          )
        )
        .addTo(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [latitude, longitude, elevation, parcelGeometry]);

  const toggle3D = () => {
    if (!map.current) return;
    
    if (is3D) {
      // Switch to 2D
      map.current.setTerrain(null);
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    } else {
      // Switch to 3D
      map.current.setTerrain({ source: "terrain", exaggeration: 1.5 });
      map.current.easeTo({ pitch: 45, bearing: -17.6, duration: 500 });
    }
    setIs3D(!is3D);
  };

  const resetView = () => {
    if (!map.current) return;
    map.current.easeTo({
      center: [longitude, latitude],
      zoom: 15,
      pitch: is3D ? 45 : 0,
      bearing: is3D ? -17.6 : 0,
      duration: 800
    });
  };

  return (
    <Card className={cn(
      "overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300",
      isExpanded && "fixed inset-4 z-50",
      className
    )}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue))] to-[hsl(var(--midnight-blue)/0.9)] text-white py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Mountain className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
            Terrain Visualization
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={toggle3D}
              title={is3D ? "Switch to 2D" : "Switch to 3D"}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={resetView}
              title="Reset view"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div 
          ref={mapContainer} 
          className={cn(
            "w-full transition-all duration-300",
            isExpanded ? "h-[calc(100vh-8rem)]" : "h-[300px]"
          )}
        />
        
        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-[hsl(var(--midnight-blue)/0.9)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[hsl(var(--data-cyan))] border-t-transparent" />
              <span className="text-sm text-white/70">Loading terrain...</span>
            </div>
          </div>
        )}

        {/* Elevation Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-border/50">
          <div className="text-[10px] font-medium text-muted-foreground mb-1">Terrain Relief</div>
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 rounded-sm bg-gradient-to-r from-[hsl(189,94%,43%)] via-[hsl(142,76%,36%)] to-[hsl(27,100%,50%)]" />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* View mode indicator */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-lg border border-border/50">
          <span className="text-[10px] font-medium text-muted-foreground">
            {is3D ? "3D Terrain" : "2D View"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
