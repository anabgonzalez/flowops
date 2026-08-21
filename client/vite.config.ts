import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Phase E: the tech app needs to load (app shell + last-cached data)
    // with no signal at all, not just handle individual failed requests.
    // registerType 'autoUpdate' means a new deploy replaces the cached
    // shell on next load without the tech needing to do anything.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'FlowOps',
        short_name: 'FlowOps',
        description: 'FlowOps field service app',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // SPA routing: any navigation not matched by a cached asset falls
        // back to the shell so deep links (e.g. /tech/jobs/<id>) still
        // load offline once the shell itself has been cached once.
        navigateFallback: '/index.html',
        // Never cache Supabase API calls in the service worker itself --
        // that's the outbox's job (see lib/outbox.ts), which handles
        // request *replay*, not response caching. Letting Workbox cache
        // API responses too would risk serving stale data silently.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => !url.pathname.startsWith('/rest/') && !url.hostname.includes('supabase.co'),
            handler: 'CacheFirst',
            options: { cacheName: 'app-shell' },
          },
        ],
      },
    }),
  ],
  // Env vars live in the monorepo root .env, not client/.env -- keep one
  // source of truth for config across server and client.
  envDir: path.resolve(__dirname, '..'),
})
