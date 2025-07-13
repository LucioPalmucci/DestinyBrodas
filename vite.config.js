import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: '/DestinyBrodas/',
    
    define: {
        __BUNGIE_API_URL__: JSON.stringify(process.env.NODE_ENV === 'production'
            ? 'https://www.bungie.net'
            : '/api'),
        __BUNGIE_STATS_URL__: JSON.stringify(process.env.NODE_ENV === 'production'
            ? 'https://stats.bungie.net'
            : '/reporte')
    },

    server: {
        proxy: {
            '/api': {
                target: 'https://www.bungie.net',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
            '/reporte': {
                target: 'https://stats.bungie.net',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/reporte/, ''),
            },
        },
    },
})