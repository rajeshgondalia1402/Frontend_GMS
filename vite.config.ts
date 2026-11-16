import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

/** GaragePilot primary brand blue (tailwind `primary-600`, the logo's face). */
const THEME_COLOR = '#0b5ed7'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The Node.js API has no CORS middleware, so the dev server proxies `/api`
  // to it instead — the browser then only ever talks to its own origin.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [
      react(),
      /**
       * Installable PWA. The service worker only ever caches the app's own
       * build output (JS, CSS, HTML shell, icons) and Google Fonts. No API
       * response is cached — not auth, OTP, Razorpay, customers, vehicles,
       * job cards or anything else — so the app behaves online exactly as it
       * did before, and nothing private is left in Cache Storage.
       */
      VitePWA({
        // A new deploy activates on its own; src/lib/pwa.ts reloads open tabs.
        registerType: 'autoUpdate',
        // Registered by hand in src/lib/pwa.ts (production builds only).
        injectRegister: null,
        // public/ files are already precached by globPatterns below.
        includeManifestIcons: false,
        manifest: {
          id: '/',
          name: 'GaragePilot',
          short_name: 'GaragePilot',
          description: 'Garage Management System',
          lang: 'en-IN',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: THEME_COLOR,
          background_color: '#ffffff',
          categories: ['business', 'productivity'],
          icons: [
            { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          cacheId: 'garagepilot',
          // Static build output only. The 860 KB source logo and the social
          // card are not used inside the app, so they stay out of the precache.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          globIgnores: ['**/GMS_Logo.png', '**/brand/garagepilot-og.png'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Navigations go NetworkFirst (below) instead of always being served
          // the precached shell, so a fresh deploy is picked up on next open.
          navigateFallback: null,
          runtimeCaching: [
            {
              // Page loads / SPA routes: network first, cached shell when offline.
              // Every route returns the same public index.html — no user data.
              urlPattern: ({ request, url, sameOrigin }) =>
                sameOrigin && request.mode === 'navigate' && !url.pathname.startsWith('/api'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'garagepilot-pages',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [200] },
                precacheFallback: { fallbackURL: 'index.html' },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'garagepilot-font-css' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'garagepilot-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Anything not matched above — the API (same-origin /api or
            // api.garagepilot.co.in), Razorpay checkout, OTP, uploads — is not
            // routed by the service worker at all and goes straight to network.
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
