import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
    alias: {
      react:       path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
      three:       path.resolve('./node_modules/three'),
      // Vite 8 / Rolldown cannot resolve package-exports subpath specifiers for three.
      // These shim files (node_modules/three/webgpu.js, tsl.js) re-export from the
      // actual build outputs so Rolldown resolves them as normal file imports.
      'three/webgpu': path.resolve('./node_modules/three/webgpu.js'),
      'three/tsl':    path.resolve('./node_modules/three/tsl.js'),
    },
  },

  optimizeDeps: {
    include: ['react-globe.gl', 'three'],
    exclude: ['three/webgpu', 'three/tsl'],
  },
})
