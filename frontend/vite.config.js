import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/course__udemy': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
