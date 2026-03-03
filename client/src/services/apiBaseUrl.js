const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
export const defaultApiBaseUrl = import.meta.env?.DEV ? '/api' : `${browserOrigin || ''}/api`.replace(/\/{2,}/g, '/');

export function normalizeApiBaseUrl(rawValue, fallbackBaseUrl = defaultApiBaseUrl, origin = browserOrigin) {
    if (!rawValue) {
        return fallbackBaseUrl;
    }

    try {
        const parsed = origin ? new URL(rawValue, origin) : new URL(rawValue);
        parsed.pathname = parsed.pathname === '/' ? '/api' : parsed.pathname.replace(/\/+$/, '');
        if (!parsed.pathname.endsWith('/api')) {
            parsed.pathname = `${parsed.pathname}/api`.replace(/\/{2,}/g, '/');
        }
        return parsed.toString().replace(/\/+$/, '');
    } catch {
        const trimmed = String(rawValue).replace(/\/+$/, '');
        if (trimmed.endsWith('/api')) {
            return trimmed;
        }
        return `${trimmed}/api`;
    }
}
