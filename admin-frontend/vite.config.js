import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        host: true,
        allowedHosts: [
            'birzha-kanaliv.biz.ua',
            'www.birzha-kanaliv.biz.ua',
            'admin.birzha-kanaliv.biz.ua',
            'api.birzha-kanaliv.biz.ua',
        ],
    },
});
