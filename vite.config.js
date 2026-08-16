import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL
  const socketUrl = env.VITE_SOCKET_URL || apiUrl?.replace(/\/api\/?$/, '')
  const proxy = {}

  if (apiUrl) {
    proxy['/api'] = {
      target: apiUrl.replace(/\/api\/?$/, ''),
      changeOrigin: true
    }
  }

  if (socketUrl) {
    proxy['/socket.io'] = {
      target: socketUrl,
      ws: true,
      changeOrigin: true
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy
    }
  }
})
