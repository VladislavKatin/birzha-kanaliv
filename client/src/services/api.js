import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Handle response errors
let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config || {};
        const status = error.response?.status;
        const method = String(config.method || 'get').toLowerCase();
        const retries = Number(config.__retryCount || 0);
        const retryable = method === 'get' && (status === 429 || status >= 500);

        if (retryable && retries < 2 && !config.__noRetry) {
            config.__retryCount = retries + 1;
            const delay = 300 * Math.pow(2, retries);
            await sleep(delay);
            return api.request(config);
        }

        if (error.response?.status === 401) {
            const isAuthPage = window.location.pathname === '/auth';
            const isAuthSync = error.config?.url?.includes('/auth/login');

            if (!isAuthPage && !isRedirecting && !isAuthSync) {
                isRedirecting = true;
                setTimeout(() => {
                    isRedirecting = false;
                    window.location.href = '/auth';
                }, 100);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
