import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filenameNew = fileURLToPath(import.meta.url);
const __dirname = resolve(__filenameNew, '..');

export default defineConfig({
  optimizeDeps: {
    include: ['docx-preview', 'jszip']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false
      }
    }
  },
  server: {
    port: 3000,
    fs:{
      strict: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8101',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('代理响应:', proxyRes.statusCode)
          })
        }
      }
    }
  }
});
