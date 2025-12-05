import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLACEHOLDER_EXAMPLES = [
  "123 Main Street, Houston TX",
  "1234567890 (Parcel ID)",
  "Main St & Oak Ave",
  "29.7604, -95.3698"
];

interface AnimatedSearchPlaceholderProps {
  className?: string;
}

export function AnimatedSearchPlaceholder({ className }: AnimatedSearchPlaceholderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`absolute inset-0 flex items-center pointer-events-none ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.5, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground pl-10 text-sm"
        >
          {PLACEHOLDER_EXAMPLES[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
