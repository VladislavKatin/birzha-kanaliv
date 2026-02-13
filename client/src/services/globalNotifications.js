export function normalizeNotification(notification) {
    if (!notification || typeof notification !== 'object') {
        return null;
    }

    const title = typeof notification.title === 'string' ? notification.title.trim() : '';
    const message = typeof notification.message === 'string' ? notification.message.trim() : '';

    if (!title && !message) {
        return null;
    }

    return {
        id: notification.id || null,
        type: notification.type || 'general',
        title,
        message,
        link: notification.link || null,
        createdAt: notification.createdAt || null,
    };
}

export function buildNotificationKey(notification, fallbackIndex = 0) {
    const normalized = normalizeNotification(notification);
    if (!normalized) {
        return null;
    }

    if (normalized.id) {
        return `id:${normalized.id}`;
    }

    const timePart = normalized.createdAt || 'na';
    const textPart = `${normalized.type}|${normalized.title}|${normalized.message}`;
    return `hash:${textPart}|${timePart}|${fallbackIndex}`;
}

export function formatToastMessage(notification) {
    const normalized = normalizeNotification(notification);
    if (!normalized) {
        return null;
    }

    if (normalized.title && normalized.message) {
        return `${normalized.title}: ${normalized.message}`;
    }

    return normalized.title || normalized.message;
}
