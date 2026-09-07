import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import path from 'path'



// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根據當前模式 (development/production) 載入 .env 檔案
  // 第三個參數 '' 代表載入所有變數，而不僅僅是 VITE_ 開頭的
  const env = loadEnv(mode, process.cwd(), '');
  console.log('開發模式:', env.DEV)
  console.log('VITE_BACKEND_URL:', env.VITE_BACKEND_URL)

  return {
    plugins: [
      react(),
      tailwindcss(),
      // 如果之後要開 PWA，記得 maximumFileSizeToCacheInBytes 也要留在這
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      allowedHosts: [
        'sps-admin.isha.net'
      ],
      hmr: {
        protocol: 'wss',
        host: 'sps-admin.isha.net',
        clientPort: 443,
      },
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL, // 改用 env 物件
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
        }
      }
    },
  }
})
