/**
 * Build ID component - displays a timestamp to verify which version is deployed.
 * This helps quickly identify if production has the latest code.
 */
export const BUILD_ID = "2025-12-26T22:00";

export const BuildId = ({ className = "" }: { className?: string }) => {
  return (
    <span className={`font-mono text-[10px] opacity-50 ${className}`}>
      build: {BUILD_ID}
    </span>
  );
};
