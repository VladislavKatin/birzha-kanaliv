import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        allowedHosts: [
            'birzha-kanaliv.biz.ua',
            'www.birzha-kanaliv.biz.ua',
            'admin.birzha-kanaliv.biz.ua',
            'api.birzha-kanaliv.biz.ua',
        ],
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
