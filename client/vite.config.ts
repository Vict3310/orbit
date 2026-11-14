import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isTest = Boolean(process.env.VITEST);

export default defineConfig({
  plugins: [
    react(),
    ...(isTest
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icons/orbit-192.png', 'icons/orbit-512.png'],
            manifest: {
              name: 'ORBIT — Astronaut Health Intelligence',
              short_name: 'ORBIT',
              description:
                'Contextual, explainable astronaut health intelligence with an offline mission simulation laboratory.',
              start_url: '/',
              scope: '/',
              display: 'standalone',
              background_color: '#080D13',
              theme_color: '#080D13',
              icons: [
                { src: '/icons/orbit-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/orbit-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: '/icons/orbit-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
              navigateFallback: '/index.html',
              cleanupOutdatedCaches: true,
              maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'orbit-fonts',
                    expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  },
                },
              ],
            },
          }),
        ]),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    testTimeout: 20000,
  },
});
