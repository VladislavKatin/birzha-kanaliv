export function buildAuthRedirectPath(targetPath) {
    const nextPath = normalizeNextPath(targetPath);
    const params = new URLSearchParams({ next: nextPath });
    return `/auth?${params.toString()}`;
}

export function resolvePostAuthPath(search, fallbackPath = '/dashboard') {
    const params = new URLSearchParams(search || '');
    const next = params.get('next');

    if (!next) {
        return fallbackPath;
    }

    return normalizeNextPath(next, fallbackPath);
}

function normalizeNextPath(nextPath, fallbackPath = '/offers') {
    if (typeof nextPath !== 'string') {
        return fallbackPath;
    }

    if (!nextPath.startsWith('/')) {
        return fallbackPath;
    }

    if (nextPath.startsWith('//')) {
        return fallbackPath;
    }

    if (nextPath === '/auth' || nextPath.startsWith('/auth?')) {
        return fallbackPath;
    }

    return nextPath;
}
