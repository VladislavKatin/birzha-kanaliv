import { io } from 'socket.io-client';

const DEFAULT_SOCKET_URL = 'http://localhost:3001';
const SOCKET_TRANSPORTS = ['websocket', 'polling'];

function trimTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}

function browserOrigin() {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return undefined;
}

export function resolveSocketUrl(env = import.meta.env) {
    const explicitSocketUrl = env?.VITE_SOCKET_URL;
    if (explicitSocketUrl) {
        return trimTrailingSlash(explicitSocketUrl);
    }

    const apiUrl = env?.VITE_API_URL;
    if (apiUrl) {
        try {
            const origin = browserOrigin();
            const parsed = origin ? new URL(apiUrl, origin) : new URL(apiUrl);
            return trimTrailingSlash(parsed.origin);
        } catch {
            return DEFAULT_SOCKET_URL;
        }
    }

    return DEFAULT_SOCKET_URL;
}

export async function createAuthenticatedSocket(getToken, {
    ioClient = io,
    socketUrl = resolveSocketUrl(),
} = {}) {
    const token = await getToken();

    return ioClient(socketUrl, {
        auth: { token },
        transports: SOCKET_TRANSPORTS,
    });
}
