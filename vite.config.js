import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Vite automatically handles SPA routing by serving index.html for all routes
    // Frontend routes (/, /chatbot, /profile, etc.) are handled by Vite directly
    // Only backend API routes are proxied below
    proxy: {
      // Backend API routes - proxy to Express server
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/static': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
      '/sessions': { target: 'http://localhost:8000', changeOrigin: true },
      '/chat_session': { target: 'http://localhost:8000', changeOrigin: true },
      '/upload': { target: 'http://localhost:8000', changeOrigin: true },
      '/generate-pdf': { target: 'http://localhost:8000', changeOrigin: true },
      '/download-report': { target: 'http://localhost:8000', changeOrigin: true },
      '/download-report-static': { target: 'http://localhost:8000', changeOrigin: true },
      '/user': { target: 'http://localhost:8000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:8000', ws: true, changeOrigin: true },
      '/chat': { target: 'http://localhost:8000', changeOrigin: true },
      '/chat/create-report': { target: 'http://localhost:8000', changeOrigin: true },
      '/reports': { target: 'http://localhost:8000', changeOrigin: true },
      '/reports/download': { target: 'http://localhost:8000', changeOrigin: true },
      '/reports/preview': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      // Backend routes that might conflict with frontend routes - use bypass
      '/portfolio': { 
        target: 'http://localhost:8000', 
        changeOrigin: true,
        // Only proxy POST/PUT/DELETE requests (API calls)
        // GET requests for HTML are handled by Vite (SPA routing)
        bypass: (req) => {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return false; // Don't proxy, let Vite handle it
          }
          return null; // Proxy API calls
        }
      },
      '/subscribers': { 
        target: 'http://localhost:8000', 
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return false;
          }
          return null;
        }
      },
      '/login': { 
        target: 'http://localhost:8000', 
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return false;
          }
          return null;
        }
      },
      '/register': { 
        target: 'http://localhost:8000', 
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return false;
          }
          return null;
        }
      },
      '/logout': { 
        target: 'http://localhost:8000', 
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return false;
          }
          return null;
        }
      }
      // Frontend-only routes (/, /chatbot, /profile, /compliance, /market-chatter, /upgrade-plan)
      // are NOT in the proxy config - Vite handles them directly
    }
  }
})