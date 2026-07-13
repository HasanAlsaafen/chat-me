import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite unconditionally logs every WS proxy write failure (see
// proxy.on('error', ...) in its middleware). These fire routinely when a
// browser tab closes/reloads mid-connection to the /socket.io proxy target
// and aren't actionable, so filter just that noise out of the console.
const logger = createLogger()
const loggerError = logger.error
logger.error = (msg, options) => {
  if (/ws proxy (error|socket error):/.test(msg) && /EPIPE|ECONNRESET/.test(msg)) return
  loggerError(msg, options)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  customLogger: logger,
  server: {
    port: 5173,
    proxy: {
      // Forwards to the live backend server-side, so the browser only ever
      // talks to localhost:5173 and never trips the backend's CORS check
      // (which only allows the https://chat-me.app origin in production).
      '/api': {
        target: 'https://chat-me.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://chat-me.app',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
