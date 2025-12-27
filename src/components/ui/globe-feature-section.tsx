import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0.2,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.0,
  baseColor: [0.9, 0.9, 0.9],
  markerColor: [255 / 255, 122 / 255, 0 / 255],
  glowColor: [6 / 255, 182 / 255, 212 / 255],
  markers: [
  // Texas (Primary Focus)
  {
    location: [29.7604, -95.3698],
    size: 0.12
  },
  // Houston
  {
    location: [32.7767, -96.797],
    size: 0.1
  },
  // Dallas
  {
    location: [30.2672, -97.7431],
    size: 0.09
  },
  // Austin
  {
    location: [29.4241, -98.4936],
    size: 0.08
  },
  // San Antonio
  {
    location: [32.7555, -97.3308],
    size: 0.07
  },
  // Fort Worth
  // Other Major US Markets
  {
    location: [40.7128, -74.006],
    size: 0.11
  },
  // New York
  {
    location: [34.0522, -118.2437],
    size: 0.1
  },
  // Los Angeles
  {
    location: [41.8781, -87.6298],
    size: 0.09
  },
  // Chicago
  {
    location: [33.4484, -112.074],
    size: 0.07
  },
  // Phoenix
  {
    location: [37.7749, -122.4194],
    size: 0.08
  } // San Francisco
  ]
};
export function Globe({
  className,
  config = GLOBE_CONFIG
}: {
  className?: string;
  config?: COBEOptions;
}) {
  let phi = 0;
  let width = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);
  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };
  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };
  const onRender = useCallback((state: Record<string, any>) => {
    if (!pointerInteracting.current) phi += 0.005;
    state.phi = phi + r;
    state.width = width * 2;
    state.height = width * 2;
  }, [r]);
  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth;
    }
  };
  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender
    });
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    });
    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [config, onRender]);
  return <div className={cn("absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]", className)}>
      <canvas className="size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]" ref={canvasRef} onPointerDown={e => updatePointerInteraction(e.clientX - pointerInteractionMovement.current)} onPointerUp={() => updatePointerInteraction(null)} onPointerOut={() => updatePointerInteraction(null)} onMouseMove={e => updateMovement(e.clientX)} onTouchMove={e => e.touches[0] && updateMovement(e.touches[0].clientX)} aria-label="Interactive globe showing BuildSmarter coverage areas" />
    </div>;
}
export default function GlobeFeatureSection() {
  const navigate = useNavigate();
  return <section className="relative w-full mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--navy))] via-[hsl(var(--navy-light))] to-[hsl(var(--navy))] border border-border/20 shadow-2xl px-6 py-16 md:px-16 md:py-24 mt-16">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="z-10 max-w-xl text-left">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4">
            Know What's Buildable. What It Costs. And What It's Worth
          </h2>
          <p className="text-body-l mb-6 text-slate-950">Commercial development moves fast — but traditional due diligence doesn't. You're waiting weeks and spending thousands for consultants to confirm what your instincts already know. By the time the report lands on your desk, the opportunity's gone</p>
          <Button variant="maxx-red" size="lg" className="inline-flex items-center gap-2" onClick={() => navigate("/beta-signup")}>
            Join Beta <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative h-[180px] w-full max-w-xl">
          <Globe className="absolute -bottom-20 -right-40 scale-150" />
        </div>
      </div>
    </section>;
}