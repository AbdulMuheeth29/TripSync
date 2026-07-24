import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) => m.cartographer()),
          await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendor
          'vendor-react': ['react', 'react-dom', 'react-hook-form'],
          // UI library
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-popover',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-accordion',
          ],
          // Routing and state management
          'vendor-routing': ['wouter', '@tanstack/react-query'],
          // Icons
          'vendor-icons': ['lucide-react', 'react-icons'],
          // Charts and data viz
          'vendor-charts': ['recharts'],
          // Maps (lazy loaded)
          'vendor-maps': ['leaflet', 'react-leaflet'],
          // Forms and validation
          'vendor-forms': ['zod', '@hookform/resolvers', 'zod-validation-error'],
          // Utilities
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // Animations
          'vendor-animations': ['framer-motion', 'canvas-confetti'],
          // DND
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
        // Use content-based hashing for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
    // Minify for production (esbuild is faster and built-in)
    minify: 'esbuild',
    // Source maps for debugging
    sourcemap: false, // Disable in production for smaller bundles
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    allowedHosts: ['localhost', '127.0.0.1', '.localhost', 'localhost:3000', '127.0.0.1:3000'],
  },
});
