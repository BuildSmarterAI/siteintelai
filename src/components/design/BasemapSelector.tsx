/**
 * Basemap Selector for Design Mode
 * 
 * Allows switching between different basemap styles (OSM, Satellite, etc.)
 */

import { Map, Satellite, Mountain, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDesignStore, type BasemapType } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";

interface BasemapSelectorProps {
  className?: string;
}

const basemapOptions: { value: BasemapType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: "osm", 
    label: "Map", 
    icon: <Map className="h-4 w-4" />,
    description: "OpenStreetMap (free)"
  },
  { 
    value: "satellite", 
    label: "Satellite", 
    icon: <Satellite className="h-4 w-4" />,
    description: "Aerial imagery"
  },
  { 
    value: "satellite-labels", 
    label: "Hybrid", 
    icon: <MapPin className="h-4 w-4" />,
    description: "Satellite with labels"
  },
  { 
    value: "terrain", 
    label: "Terrain", 
    icon: <Mountain className="h-4 w-4" />,
    description: "Topographic map"
  },
];

export function BasemapSelector({ className }: BasemapSelectorProps) {
  const { basemap, setBasemap } = useDesignStore();

  const currentOption = basemapOptions.find(opt => opt.value === basemap) || basemapOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("gap-2 h-8", className)}
        >
          {currentOption.icon}
          <span className="hidden sm:inline">{currentOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Basemap Style</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup 
          value={basemap} 
          onValueChange={(value) => setBasemap(value as BasemapType)}
        >
          {basemapOptions.map((option) => (
            <DropdownMenuRadioItem 
              key={option.value} 
              value={option.value}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2 flex-1">
                {option.icon}
                <div className="flex flex-col">
                  <span className="text-sm">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
