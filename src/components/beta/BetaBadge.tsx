import { motion } from "framer-motion";

export const BetaBadge = () => {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary backdrop-blur-sm"
      animate={{ 
        borderColor: [
          "hsl(var(--primary))", 
          "hsl(var(--primary) / 0.5)", 
          "hsl(var(--primary))"
        ] 
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
      <span className="text-primary text-xs font-semibold uppercase tracking-wide">
        Limited Beta Access
      </span>
    </motion.div>
  );
};
