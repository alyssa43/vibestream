import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must differ between dev and build: the app is served at the domain
// root in local dev (Vite proxies /api to the Express server directly), but
// lives under /vibestream in production (Nginx strips the subpath before
// forwarding to Express). Without this split, BASE_URL is '/vibestream' in
// dev too, and client requests to /vibestream/api/* don't match the '/api'
// proxy rule below, they silently fall through to the SPA HTML fallback.
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/vibestream',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}))