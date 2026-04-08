import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REEMPLAZE 'nombre-de-su-repositorio' por el nombre real en GitHub
  base: '/Agua-Vital-App/', 
})