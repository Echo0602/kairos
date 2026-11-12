import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 项目站点固定部署在 /<仓库名>/ 下。
// 若改用自定义域名或用户站点，构建时用 KAIROS_BASE=/ npm run build 覆盖。
const base = process.env.KAIROS_BASE ?? '/kairos/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Kairos 知时',
        short_name: '知时',
        description: '一个不会让你错过重要事情的待办与每日计划工具。',
        lang: 'zh-CN',
        theme_color: '#31594B',
        background_color: '#F7F8F5',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'],
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173 },
})
