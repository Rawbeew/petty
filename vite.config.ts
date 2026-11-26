import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1200 },
})
