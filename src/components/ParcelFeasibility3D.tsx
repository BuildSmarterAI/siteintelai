import React, { useMemo, useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

type Parcel = {
  id: string
  parcel_owner: string
  project_type: "retail" | "multifamily" | "medical" | "industrial" | "office" | string
  acreage_cad: number
  timeline: "0–3m" | "3–6m" | "6–12m" | "12m+" | string
  feasibility_score: number // 0–100
  desired_budget: number // USD
}

type Props = {
  data?: Parcel[]
  heightMode?: "score" | "budget"
  canvasHeight?: number | string
  autoRotate?: boolean
}

// ---- Sample Houston-ish demo data (edit/replace at will) ----
const SAMPLE: Parcel[] = [
  {
    id: "HCAD-001",
    parcel_owner: "Greenfield Capital",
    project_type: "multifamily",
    acreage_cad: 2.1,
    timeline: "6–12m",
    feasibility_score: 84,
    desired_budget: 28500000
  },
  {
    id: "HCAD-002",
    parcel_owner: "MedCore Partners",
    project_type: "medical",
    acreage_cad: 1.3,
    timeline: "3–6m",
    feasibility_score: 77,
    desired_budget: 18000000
  },
  {
    id: "HCAD-003",
    parcel_owner: "Lone Star Retail",
    project_type: "retail",
    acreage_cad: 1.0,
    timeline: "0–3m",
    feasibility_score: 68,
    desired_budget: 9500000
  },
  {
    id: "HCAD-004",
    parcel_owner: "Bayou Logistics",
    project_type: "industrial",
    acreage_cad: 3.7,
    timeline: "12m+",
    feasibility_score: 72,
    desired_budget: 42000000
  },
  {
    id: "HCAD-005",
    parcel_owner: "Skyline Holdings",
    project_type: "office",
    acreage_cad: 2.8,
    timeline: "6–12m",
    feasibility_score: 59,
    desired_budget: 22000000
  }
]

// ---- Color system by project type (brand-friendly & color-blind aware) ----
const TYPE_COLORS: Record<string, string> = {
  retail: "#FF7A00",       // Feasibility Orange
  multifamily: "#14B8A6",  // teal
  medical: "#8B5CF6",      // purple
  industrial: "#6B7280",   // slate
  office: "#0EA5E9"        // sky
}
const fallbackColor = "#94A3B8" // muted slate

// Map score (0–100) → block height (meters)
const heightFromScore = (score: number) => {
  const clamped = Math.max(0, Math.min(100, score))
  // 0 → 0.4m, 100 → 4m (pleasant range for small component)
  return 0.4 + (clamped / 100) * 3.6
}

// Map budget → height with square-root compression (so outliers don't dominate)
const heightFromBudget = (usd: number) => {
  const M = usd / 1_000_000 // millions
  // 0M → 0.4m, 10M → ~2m, 50M → ~4m (approx)
  return 0.4 + Math.min(4, Math.sqrt(Math.max(0, M)) * 0.5)
}

// Subtle emissive for glow on hover
const emissiveFromBase = (hex: string, hover: boolean) => (hover ? hex : "#000000")

// Nice round-rect block via simple bevel: box is fine (fast + clean)
function ParcelBlock({
  p,
  position,
  color,
  height,
  onHover,
  onBlur,
  onClick
}: {
  p: Parcel
  position: [number, number, number]
  color: string
  height: number
  onHover: (p: Parcel, e: any) => void
  onBlur: () => void
  onClick: (p: Parcel) => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  // Gentle idle "breath" pulse by feasibility
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) {
      const wiggle = Math.sin(t * 1.2 + height) * 0.02
      ref.current.position.y = height / 2 + wiggle
    }
  })

  return (
    <mesh
      ref={ref}
      position={[position[0], height / 2, position[2]]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHover(p, e)
      }}
      onPointerOut={() => {
        setHovered(false)
        onBlur()
      }}
      onClick={() => onClick(p)}
    >
      <boxGeometry args={[0.9, height, 0.9]} />
      <meshStandardMaterial
        color={color}
        roughness={0.45}
        metalness={0.05}
        emissive={emissiveFromBase(color, hovered)}
        emissiveIntensity={hovered ? 0.2 : 0}
      />
    </mesh>
  )
}

function Scene({
  parcels,
  heightMode,
  autoRotate,
  onHoverParcel,
  onBlurParcel,
  onClickParcel
}: {
  parcels: Parcel[]
  heightMode: "score" | "budget"
  autoRotate?: boolean
  onHoverParcel: (p: Parcel, e: any) => void
  onBlurParcel: () => void
  onClickParcel: (p: Parcel) => void
}) {
  const group = useRef<THREE.Group>(null!)

  // Arrange parcels in a tidy grid
  const layout = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(parcels.length))
    const gap = 1.2
    const positions: [number, number, number][] = []
    parcels.forEach((_, i) => {
      const r = Math.floor(i / cols)
      const c = i % cols
      positions.push([c * gap, 0, r * gap])
    })
    // Center them
    const totalW = (cols - 1) * 1.2
    const totalH = (Math.ceil(parcels.length / cols) - 1) * 1.2
    return positions.map(([x, y, z]) => [x - totalW / 2, y, z - totalH / 2] as [number, number, number])
  }, [parcels.length])

  useFrame((_, dt) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += dt * 0.15
    }
  })

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[6, 8, 5]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#eef2ff", "#e5e7eb", 0.25]} />

      {/* Shadow floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.001, 0]}>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      {/* Parcels */}
      <group ref={group}>
        {parcels.map((p, i) => {
          const color = TYPE_COLORS[p.project_type] ?? fallbackColor
          const h = heightMode === "score" ? heightFromScore(p.feasibility_score) : heightFromBudget(p.desired_budget)
          return (
            <ParcelBlock
              key={p.id}
              p={p}
              position={layout[i]}
              color={color}
              height={h}
              onHover={onHoverParcel}
              onBlur={onBlurParcel}
              onClick={onClickParcel}
            />
          )
        })}
      </group>

      {/* Controls */}
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minPolarAngle={0.6} maxPolarAngle={1.35} />
    </>
  )
}

export default function ParcelFeasibility3D({
  data = SAMPLE,
  heightMode = "score",
  canvasHeight = 420,
  autoRotate = true
}: Props) {
  // Hover tooltip (DOM overlay)
  const [tooltip, setTooltip] = useState<{ p: Parcel; x: number; y: number } | null>(null)
  // Pinned selection (sidebar card)
  const [selected, setSelected] = useState<Parcel | null>(null)

  // Keep tooltip near cursor
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (tooltip) setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [tooltip])

  const onHoverParcel = (p: Parcel, e: any) => {
    setTooltip({ p, x: e.clientX, y: e.clientY })
  }
  const onBlurParcel = () => setTooltip(null)
  const onClickParcel = (p: Parcel) => setSelected(p)

  return (
    <div style={{ position: "relative", width: "100%", height: typeof canvasHeight === "number" ? `${canvasHeight}px` : canvasHeight }}>
      <Canvas
        shadows
        camera={{ position: [6, 5, 7], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, Math.min(2, window.devicePixelRatio || 1)]}
      >
        <Scene
          parcels={data}
          heightMode={heightMode}
          autoRotate={autoRotate}
          onHoverParcel={onHoverParcel}
          onBlurParcel={onBlurParcel}
          onClickParcel={onClickParcel}
        />
      </Canvas>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y + 14,
            background: "rgba(17, 24, 39, 0.92)",
            color: "white",
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.35,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 50,
            maxWidth: 260
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.p.parcel_owner}</div>
          <div><b>Type:</b> {tooltip.p.project_type}</div>
          <div><b>Acreage:</b> {tooltip.p.acreage_cad.toFixed(2)} ac</div>
          <div><b>Timeline:</b> {tooltip.p.timeline}</div>
          <div><b>Feasibility:</b> {tooltip.p.feasibility_score}/100</div>
          <div><b>Budget:</b> ${Math.round(tooltip.p.desired_budget / 1_000_000)}M</div>
        </div>
      )}

      {/* Sidebar (pinned on click) */}
      {selected && (
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            width: 300,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "saturate(1.2) blur(4px)",
            borderRadius: 14,
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            padding: 14,
            zIndex: 40,
            fontSize: 13,
            color: "#0f172a"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.parcel_owner}</div>
            <button
              onClick={() => setSelected(null)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 16,
                cursor: "pointer",
                color: "#64748b"
              }}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "98px 1fr", rowGap: 6, columnGap: 8 }}>
            <div style={{ color: "#334155" }}>Project Type</div><div>{selected.project_type}</div>
            <div style={{ color: "#334155" }}>Acreage</div><div>{selected.acreage_cad.toFixed(2)} ac</div>
            <div style={{ color: "#334155" }}>Timeline</div><div>{selected.timeline}</div>
            <div style={{ color: "#334155" }}>Feasibility</div><div>{selected.feasibility_score}/100</div>
            <div style={{ color: "#334155" }}>Budget</div><div>${(selected.desired_budget / 1_000_000).toFixed(1)}M</div>
          </div>
          <hr style={{ margin: "10px 0", border: 0, borderTop: "1px solid #e2e8f0" }} />
          <div style={{ fontSize: 12.5, color: "#475569" }}>
            Tip: switch to budget-based extrusion by setting <code>heightMode="budget"</code>.
            Replace the in-file sample data with your live SiteIntel <code>applications</code> rows.
          </div>
        </div>
      )}
    </div>
  )
}
