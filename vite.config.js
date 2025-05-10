import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
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
    // Force minification even with large files
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
