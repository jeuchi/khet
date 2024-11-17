import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: "/khet/ui",
    plugins: [react()],
    server: {
      hmr: {
        overlay: false
      },
      proxy: {
        '/api': {
          target: mode !== 'production' ? 'http://localhost:5000' : 'https://jeuchi.pythonanywhere.com/',
          changeOrigin: true
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`
        }
      }
    }
  }
})
