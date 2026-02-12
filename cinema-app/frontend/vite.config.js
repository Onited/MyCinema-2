import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker, services communicate via container names on the internal network.
// Locally, they're exposed on localhost ports.
const MOVIES_URL = process.env.VITE_MOVIES_URL || 'http://localhost:8090'
const USERS_URL = process.env.VITE_USERS_URL || 'http://localhost:8000'
const SESSIONS_URL = process.env.VITE_SESSIONS_URL || 'http://localhost:3003'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/movies': {
        target: MOVIES_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/movies/, '/films'),
      },
      '/api/users': {
        target: USERS_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/users/, '/api/v1/users'),
      },
      '/api/sessions': {
        target: SESSIONS_URL,
        changeOrigin: true,
      },
      '/api/reservations': {
        target: SESSIONS_URL,
        changeOrigin: true,
      },
    },
  },
})
