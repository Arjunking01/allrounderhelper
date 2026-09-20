import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-32.png', 'icons/favicon-16.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ALLROUNDER HELPER',
        short_name: 'AR Helper',
        description: 'ALLROUNDER HELPER — free academic calculators, productivity tools, AI study assistant, and document utilities built for students.',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Any request whose navigation should hit a real static file on the
        // server (not the SPA shell) must be excluded here. Without this,
        // a browser with the service worker already installed will serve
        // the cached index.html for direct navigations to these URLs,
        // producing the app's client-side 404 page even though the file
        // exists and returns 200 on the server (e.g. for Googlebot, or any
        // fetch without an active service worker).
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
          /^\/ads\.txt$/,
          /^\/google[^/]*\.html$/,
          /\.[a-zA-Z0-9]+$/,
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    outDir: 'dist',
  },
  base: '/',
})
