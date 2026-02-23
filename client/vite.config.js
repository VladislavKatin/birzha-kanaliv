import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    if (id.includes('recharts')) return 'vendor-recharts';
                    if (id.includes('firebase')) return 'vendor-firebase';
                    if (id.includes('react-router')) return 'vendor-router';
                    if (id.includes('lucide-react')) return 'vendor-icons';
                    if (id.includes('socket.io-client')) return 'vendor-socket';
                    if (id.includes('react-hot-toast')) return 'vendor-toast';
                    if (id.includes('axios')) return 'vendor-http';
                    return 'vendor-core';
                },
            },
        },
    },
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
