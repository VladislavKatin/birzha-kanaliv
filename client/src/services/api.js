import axios from 'axios';
import { auth } from './firebase';

const defaultApiBaseUrl = import.meta.env.DEV ? '/api' : `${window.location.origin}/api`;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(headerValue) {
    const raw = String(headerValue || '').trim();
    if (!raw) {
        return 0;
    }

    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds > 0) {
        return seconds * 1000;
    }

    const date = Date.parse(raw);
    if (Number.isFinite(date)) {
        return Math.max(0, date - Date.now());
    }

    return 0;
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
        const maxRetries = status === 429 ? 1 : 2;

        if (retryable && retries < maxRetries && !config.__noRetry) {
            config.__retryCount = retries + 1;
            const retryAfterMs = parseRetryAfterMs(error.response?.headers?.['retry-after']);
            const backoffMs = 300 * Math.pow(2, retries);
            const delay = retryAfterMs > 0 ? retryAfterMs : backoffMs;
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
