import { BuildId } from "@/components/BuildId";

/**
 * Fixed position build badge - always visible in bottom-left corner.
 * Helps verify which build is deployed on any route (including reports).
 */
export const GlobalBuildBadge = () => {
  return (
    <div className="fixed bottom-2 left-2 z-50 bg-black/50 backdrop-blur-sm px-2 py-1 rounded pointer-events-none">
      <BuildId className="text-white/60" />
    </div>
  );
};
