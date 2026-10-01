import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Göreli yollar: site GitHub Pages'te /repo-adi/ altında da, kök dizinde de çalışır.
  base: './',
})
