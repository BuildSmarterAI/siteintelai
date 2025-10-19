import { motion } from "framer-motion";

export const BetaBadge = () => {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary border border-white backdrop-blur-sm"
      animate={{ 
        borderColor: [
          "hsl(0 0% 100%)", 
          "hsl(0 0% 100% / 0.7)", 
          "hsl(0 0% 100%)"
        ] 
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true" />
      <span className="text-white text-xs font-semibold uppercase tracking-wide">
        Limited Beta Access
      </span>
    </motion.div>
  );
};
