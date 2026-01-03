/**
 * SiteIntel™ Feasibility Platform
 * Copyright (c) 2024-2025 BuildSmarter Technologies, Inc.
 * All rights reserved. Unauthorized copying, modification, or distribution
 * of this software or its components is strictly prohibited.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// @ts-ignore - no types available
import { viteObfuscateFile } from "vite-plugin-obfuscator";
import cesium from "vite-plugin-cesium";
import type { Plugin } from "vite";

// Custom plugin to make CSS non-blocking
function deferCSS(): Plugin {
  return {
    name: 'defer-css',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
        '<link rel="preload" as="style" href="$1" onload="this.onload=null;this.rel=\'stylesheet\'">' +
        '<noscript><link rel="stylesheet" href="$1"></noscript>'
      );
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    cesium(),
    mode === "development" && componentTagger(),
    mode === "production" && deferCSS(),
    // Obfuscation disabled - breaks Cesium/Resium WebGL initialization
    // mode === "production" && viteObfuscateFile({
    //   compact: true,
    //   controlFlowFlattening: false,
    //   deadCodeInjection: false,
    //   debugProtection: false,
    //   disableConsoleOutput: true,
    //   identifierNamesGenerator: 'hexadecimal',
    //   renameGlobals: false,
    //   rotateStringArray: true,
    //   selfDefending: false,
    //   stringArray: true,
    //   stringArrayThreshold: 0.75,
    //   unicodeEscapeSequence: false
    // })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@siteintel/types": path.resolve(__dirname, "./packages/types/src"),
      "@siteintel/gis-utils": path.resolve(__dirname, "./packages/gis-utils/src"),
    },
    // Deduplicate react/react-dom and radix to fix resium's createPortal import and hook conflicts
    dedupe: ['react', 'react-dom', 'cesium', 'resium', '@radix-ui/react-tooltip'],
  },
  optimizeDeps: {
    // Include resium for proper pre-bundling with React 18
    include: ['resium', 'cesium'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
}));