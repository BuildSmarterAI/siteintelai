/**
 * Environment-aware logging utility
 * Conditionally logs only in development to keep production console clean
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /** Standard log - only in development */
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Warning log - only in development */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  /** Error log - always shown (errors should be visible in production) */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /** Debug with prefix - only in development */
  debug: (prefix: string, ...args: unknown[]) => {
    if (isDev) console.log(`[${prefix}]`, ...args);
  },

  /** Tile debugging - only in development */
  tile: (...args: unknown[]) => {
    if (isDev) console.log('🔍 TILE DEBUG:', ...args);
  },

  /** Map debugging - only in development */
  map: (...args: unknown[]) => {
    if (isDev) console.log('🗺️', ...args);
  },

  /** GIS/layer debugging - only in development */
  gis: (...args: unknown[]) => {
    if (isDev) console.log('📍 GIS:', ...args);
  },

  /** Performance timing - only in development */
  perf: (label: string, startTime: number) => {
    if (isDev) {
      const duration = performance.now() - startTime;
      console.log(`⏱️ [${label}] ${duration.toFixed(2)}ms`);
    }
  },

  /** Group logs - only in development */
  group: (label: string) => {
    if (isDev) console.group(label);
  },

  /** End group - only in development */
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
};
