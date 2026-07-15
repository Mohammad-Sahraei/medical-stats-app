import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'MedStat',
        short_name: 'MedStat',
        description: 'پلتفرم آموزشی مدستت برای دانشجویان و اساتید',
        lang: 'fa',
        dir: 'rtl',
        start_url: '/login',
        display: 'standalone',
        theme_color: '#f7f5f0',
        background_color: '#f7f5f0',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-shell/static-asset caching only; API calls are JWT-guarded and
        // should always hit the network rather than being cached offline.
        navigateFallbackDenylist: [/^\/api\//],
        // Do NOT set skipWaiting/clientsClaim here: registerType 'prompt'
        // relies on the new service worker sitting in the "waiting" state
        // until the user confirms the in-app update modal (UpdatePrompt),
        // which then explicitly triggers the takeover + reload.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
