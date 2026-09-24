import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // expose only these two by name; a SUPABASE_ prefix would also leak server keys like SUPABASE_SERVICE_ROLE_KEY
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.SUPABASE_PUBLISHABLE_KEY),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Aksis',
          short_name: 'Aksis',
          description: 'Assignments, quizzes and requirements, sorted by what’s due next.',
          theme_color: '#7C3AED',
          background_color: '#FFFFFF',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        // app shell only: Supabase is on another origin, so data always goes to the network
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  }
})
