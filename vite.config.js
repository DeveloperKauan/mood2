import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A LINHA ABAIXO É O SEGREDO DO GITHUB PAGES:
  base: "./", 
})
