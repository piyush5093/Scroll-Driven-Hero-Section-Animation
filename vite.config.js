import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Base path configurable via env var; defaults to project folder name for GitHub Pages
const base = process.env.VITE_BASE_PATH ?? '/Scroll-Driven-Hero-Section-Animation/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
