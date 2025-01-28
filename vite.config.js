import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: '/DestinyBrodas/',
    server: {
        proxy: {
            '/api': {
                target: 'https://www.bungie.net', // El dominio de la API
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''), // Reescribe '/api' como '/'
            },
        },
    },
})


