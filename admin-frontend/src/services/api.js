import axios from 'axios';
import { auth } from './firebase';

const defaultApiBaseUrl = import.meta.env.DEV ? '/api' : `${window.location.origin}/api`;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
