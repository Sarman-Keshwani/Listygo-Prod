import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
    // Removed invalid tailwindcss import
  ],
  build: {
    // Use faster build target
    target: 'es2015',
    // Increase chunk size warning to avoid console noise
    chunkSizeWarningLimit: 1500,
    // Disable source maps in production
    sourcemap: false,
    // Split vendor chunks better
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Split node_modules into separate chunks
            return 'vendor';
          }
        }
      }
    },
    // Use esbuild instead of terser (esbuild is faster but slightly larger output)
    minify: 'esbuild',
  }
})
