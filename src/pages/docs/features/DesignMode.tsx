import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DiagramBlock } from "@/components/docs/DiagramBlock";
import { Compass, Box, Ruler, CheckCircle, Keyboard, Layers } from "lucide-react";

const wizardSteps = [
  { step: 1, name: "Site Confirmation", description: "Verify parcel boundaries and regulatory envelope" },
  { step: 2, name: "Use Types", description: "Select development types (Industrial, Multifamily, QSR, etc.)" },
  { step: 3, name: "Building Type", description: "Choose from 16+ building model templates" },
  { step: 4, name: "Program Targets", description: "Define GFA, floor counts, unit mix" },
  { step: 5, name: "Parking", description: "Configure parking ratios and placement" },
  { step: 6, name: "Templates", description: "Apply standard prototype configurations" },
  { step: 7, name: "Sustainability", description: "LEED, solar, EV charging options" },
  { step: 8, name: "Generate", description: "Create 3D massing and compliance report" },
];

const DesignMode = () => {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[hsl(var(--data-cyan))]">
            <Compass className="h-8 w-8" />
            <span className="text-sm font-medium uppercase tracking-wider">Platform Feature</span>
          </div>
          <h1 id="overview" className="font-heading text-4xl md:text-5xl text-white">
            Design Mode
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            8-step conceptual design wizard with real-time 3D visualization and compliance validation. 
            Transform feasibility data into actionable development programs.
          </p>
        </div>

        {/* Access */}
        <div className="p-4 rounded-xl border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--data-cyan))]/10">
          <p className="text-white/80">
            <strong className="text-white">Access:</strong> Design Mode is available at{" "}
            <code className="px-2 py-1 rounded bg-white/10 text-[hsl(var(--data-cyan))]">/design/:applicationId</code>{" "}
            after completing a feasibility application.
          </p>
        </div>

        {/* 8-Step Wizard */}
        <section className="space-y-4">
          <h2 id="wizard" className="font-heading text-2xl text-white">8-Step Wizard Flow</h2>
          <div className="grid gap-3">
            {wizardSteps.map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--feasibility-orange))]/20 flex items-center justify-center text-[hsl(var(--feasibility-orange))] font-heading">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-white">{item.name}</h3>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="space-y-4">
          <h2 id="architecture" className="font-heading text-2xl text-white">System Architecture</h2>
          <DiagramBlock
            title="Design Mode Architecture"
            content={`┌─────────────────────────────────────────────────────────────────────┐
│                      DESIGN MODE FRONTEND                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────────────────┐     ┌───────────────────────┐          │
│   │   useDesignStore      │     │   useWizardStore      │          │
│   │   (Zustand)           │     │   (Zustand)           │          │
│   │   - session           │     │   - currentStep       │          │
│   │   - variants[]        │     │   - completedSteps[]  │          │
│   │   - canvasMode        │     │   - validation        │          │
│   └───────────────────────┘     └───────────────────────┘          │
│              │                           │                          │
│              └───────────┬───────────────┘                          │
│                          ▼                                          │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                  DUAL CANVAS ENGINE                          │  │
│   │  ┌─────────────────────┐   ┌─────────────────────────────┐  │  │
│   │  │  3D Cesium (Resium) │   │  2D MapLibre               │  │  │
│   │  │  - Photorealistic   │   │  - Precise measurement     │  │  │
│   │  │  - Building models  │   │  - Parcel drawing          │  │  │
│   │  │  - Shadow analysis  │   │  - Setback visualization   │  │  │
│   │  └─────────────────────┘   └─────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          ▼                                          │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │              COMPLIANCE VALIDATION ENGINE                    │  │
│   │  designCompliance.ts + designMetrics.ts                      │  │
│   │  - FAR validation (PASS/WARN/FAIL)                          │  │
│   │  - Height limit checking                                     │  │
│   │  - Lot coverage calculation                                  │  │
│   │  - Turf.js geometry operations                               │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│   Edge Function: compute-regulatory-envelope                        │
│   PostGIS RPC: compute_buildable_footprint                         │
│   Tables: regulatory_envelopes, design_sessions, design_variants   │
└─────────────────────────────────────────────────────────────────────┘`}
          />
        </section>

        {/* Key Features */}
        <section className="space-y-4">
          <h2 id="features" className="font-heading text-2xl text-white">Key Capabilities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Box className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">3D Visualization</h3>
              <p className="text-sm text-white/60">
                Cesium-powered photorealistic rendering with 16+ building model templates. 
                Real-time shadow analysis and massing studies.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Compliance Validation</h3>
              <p className="text-sm text-white/60">
                Instant PASS/WARN/FAIL status for FAR, height limits, and lot coverage. 
                Regulatory envelope computation via PostGIS.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Layers className="h-6 w-6 text-[hsl(var(--feasibility-orange))] mb-3" />
              <h3 className="font-heading text-white mb-2">Variant Comparison</h3>
              <p className="text-sm text-white/60">
                Create and compare multiple design variants with side-by-side metrics. 
                Export preferred configurations for stakeholder review.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <Ruler className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-3" />
              <h3 className="font-heading text-white mb-2">Program Calculator</h3>
              <p className="text-sm text-white/60">
                Real-time GFA, unit counts, and parking ratio calculations. 
                Yield testing across development typologies.
              </p>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="space-y-4">
          <h2 id="shortcuts" className="font-heading text-2xl text-white">Keyboard Shortcuts</h2>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <Keyboard className="h-6 w-6 text-[hsl(var(--data-cyan))] mb-4" />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Toggle 2D/3D Canvas</span>
                <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono">Tab</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Next Step</span>
                <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono">→</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Previous Step</span>
                <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono">←</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Reset View</span>
                <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono">R</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Toggle Compliance Panel</span>
                <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono">C</kbd>
              </div>
            </div>
          </div>
        </section>

        {/* Related */}
        <div className="flex flex-wrap gap-3 pt-8 border-t border-white/10">
          <Link
            to="/docs/cityengine-integration"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            CityEngine Integration →
          </Link>
          <Link
            to="/docs/features/feasibility-reports"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Feasibility Reports →
          </Link>
        </div>
      </div>
    </DocsLayout>
  );
};

export default DesignMode;
