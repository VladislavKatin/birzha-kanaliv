import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    if (id.includes('firebase')) return 'vendor-firebase';
                    if (id.includes('react-router')) return 'vendor-router';
                    if (id.includes('lucide-react')) return 'vendor-icons';
                    if (id.includes('react-hot-toast')) return 'vendor-toast';
                    if (id.includes('axios')) return 'vendor-http';
                    return 'vendor-core';
                },
            },
        },
    },
    server: {
        port: 5174,
        host: true,
        allowedHosts: [
            'birzha-kanaliv.biz.ua',
            'www.birzha-kanaliv.biz.ua',
            'admin.birzha-kanaliv.biz.ua',
            'api.birzha-kanaliv.biz.ua',
        ],
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
