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
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[3]" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Gradient for connection glow */}
          <linearGradient id="verificationGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Curved connection lines with flow animation */}
        {[
          [nodes[0], nodes[4]],
          [nodes[1], nodes[4]],
          [nodes[2], nodes[4]],
          [nodes[3], nodes[4]],
        ].map(([start, end], index) => {
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2 + (index % 2 === 0 ? -5 : 5);
          const path = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
          
          return (
            <motion.path
              key={`line-${index}`}
              d={path}
              fill="none"
              stroke="url(#verificationGlow)"
              strokeWidth="2"
              strokeOpacity="0.3"
              strokeDasharray="1000"
              initial={{ strokeDashoffset: 1000, opacity: 0 }}
              animate={{ 
                strokeDashoffset: 0,
                opacity: 0.4
              }}
              transition={{
                strokeDashoffset: { duration: 5, delay: 0.5 + index * 0.4, ease: "easeInOut" },
                opacity: { duration: 0.8, delay: 0.5 + index * 0.4 }
              }}
            />
          );
        })}
      </svg>

      {/* Data nodes with orange glow */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: node.delay }}
        >
          {/* Orange radial glow */}
          <motion.div
            className="absolute -inset-8 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
            }}
            animate={{
              scale: [0, 1.2, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: node.delay,
              ease: "easeOut",
            }}
            aria-hidden="true"
          />

          {/* Node container */}
          <motion.div
            className="relative w-3 h-3"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: node.delay,
              ease: "easeInOut",
            }}
          >
            {/* Core dot with gradient */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)'
              }}
            />
            
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 bg-accent rounded-full"
              animate={{
                scale: [1, 2.5],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 3,
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
