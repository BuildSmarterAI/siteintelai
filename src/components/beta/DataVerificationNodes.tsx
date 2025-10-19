import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export const DataVerificationNodes = () => {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Respect reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldAnimate(!mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setShouldAnimate(!e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const nodes: Node[] = [
    { id: 1, x: 15, y: 20, delay: 0 },
    { id: 2, x: 85, y: 15, delay: 0.2 },
    { id: 3, x: 25, y: 70, delay: 0.4 },
    { id: 4, x: 75, y: 75, delay: 0.6 },
    { id: 5, x: 50, y: 45, delay: 0.3 },
  ];

  if (!shouldAnimate) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full">
        {/* Connection lines */}
        {[
          [nodes[0], nodes[4]],
          [nodes[1], nodes[4]],
          [nodes[2], nodes[4]],
          [nodes[3], nodes[4]],
        ].map(([start, end], index) => (
          <motion.line
            key={`line-${index}`}
            x1={`${start.x}%`}
            y1={`${start.y}%`}
            x2={`${end.x}%`}
            y2={`${end.y}%`}
            stroke="hsl(var(--accent))"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.3,
              strokeDashoffset: [0, -8]
            }}
            transition={{
              pathLength: { duration: 1.5, delay: 0.5 + index * 0.1 },
              opacity: { duration: 0.5, delay: 0.5 + index * 0.1 },
              strokeDashoffset: { 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }
            }}
          />
        ))}
      </svg>

      {/* Data nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: node.delay }}
        >
          <motion.div
            className="relative w-3 h-3"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: node.delay,
              ease: "easeInOut",
            }}
          >
            {/* Core dot */}
            <div className="absolute inset-0 bg-accent rounded-full" />
            
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 bg-accent rounded-full"
              animate={{
                scale: [1, 2.5],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: node.delay,
                ease: "easeOut",
              }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};
