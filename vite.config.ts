import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/shukkin-calendar/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '出勤カレンダー',
        short_name: '出勤カレンダー',
        description: '毎月16日始まりの出勤表と運収を記録するアプリ',
        theme_color: '#fb925b',
        background_color: '#fffcf7',
        display: 'standalone',
        start_url: '/shukkin-calendar/',
        scope: '/shukkin-calendar/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
