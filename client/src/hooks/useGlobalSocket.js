import { useEffect, useRef, useState, useCallback } from 'react';
import { auth } from '../services/firebase';
import { createAuthenticatedSocket } from '../services/socket';
import api from '../services/api';
import { buildNotificationKey } from '../services/globalNotifications';

const MAX_NOTIFICATIONS = 200;

function toUnixTime(value) {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
}

function mapActivityEventToNotification(event) {
    if (!event || typeof event !== 'object') return null;
    const title = typeof event.title === 'string' ? event.title : '';
    const message = typeof event.preview === 'string' ? event.preview : '';
    if (!title && !message) return null;

    return {
        id: `activity-${event.type || 'event'}-${event.id || Math.random().toString(36).slice(2)}`,
        type: event.type || 'activity',
        title,
        message,
        link: event.link || null,
        createdAt: event.date || null,
        silent: true,
    };
}

function mergeNotifications(prevList, incomingList) {
    const next = [];
    const seenKeys = new Set();
    const all = [...incomingList, ...prevList];

    for (let index = 0; index < all.length; index += 1) {
        const item = all[index];
        const key = buildNotificationKey(item, index);
        if (!key || seenKeys.has(key)) continue;
        seenKeys.add(key);
        next.push(item);
    }

    next.sort((a, b) => toUnixTime(b.createdAt) - toUnixTime(a.createdAt));
    return next.slice(0, MAX_NOTIFICATIONS);
}

/**
 * Global socket hook for app-wide events: notifications, presence, swap status.
 * Unlike useSocket (per-match chat), this connects once for the entire session.
 *
 * @returns {{ connected, notifications, onlineUsers, clearNotification }}
 */
export default function useGlobalSocket() {
    const socketRef = useRef(null);
    const historyLoadedRef = useRef(false);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const connect = useCallback(async () => {
        if (socketRef.current?.connected) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            const socket = await createAuthenticatedSocket(() => user.getIdToken());

            socket.on('connect', () => {
                setConnected(true);
                socket.emit('get:online-users');
            });

            socket.on('disconnect', () => setConnected(false));

            // ── Notifications ─────────────────────────────
            socket.on('notification:new', (notification) => {
                setNotifications((prev) => mergeNotifications(prev, [notification]));
            });

            // ── Swap status changes ───────────────────────
            socket.on('swap:status-changed', (payload) => {
                // Dispatch a custom event so any component can listen
                window.dispatchEvent(new CustomEvent('swap:status-changed', { detail: payload }));
            });

            socket.on('support:message', (payload) => {
                window.dispatchEvent(new CustomEvent('support:message', { detail: payload }));
            });

            // ── Presence ──────────────────────────────────
            socket.on('online:users', (data) => {
                setOnlineUsers(data.userIds || []);
            });

            socket.on('user:online', ({ userId }) => {
                setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
            });

            socket.on('user:offline', ({ userId }) => {
                setOnlineUsers(prev => prev.filter(id => id !== userId));
            });

            socket.on('error', (err) => {
                console.error('Global socket error:', err.message);
            });

            socketRef.current = socket;

            if (!historyLoadedRef.current) {
                try {
                    const response = await api.get('/user/activity?limit=100');
                    const events = Array.isArray(response.data?.events) ? response.data.events : [];
                    const historyNotifications = events
                        .map(mapActivityEventToNotification)
                        .filter(Boolean);

                    if (historyNotifications.length > 0) {
                        setNotifications((prev) => mergeNotifications(prev, historyNotifications));
                    }
                    historyLoadedRef.current = true;
                } catch (historyError) {
                    console.error('Failed to load notification history:', historyError);
                }
            }
        } catch (error) {
            console.error('Global socket connection failed:', error);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnected(false);
        }
    }, []);

    const clearNotification = useCallback((index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            connect();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        connected,
        notifications,
        onlineUsers,
        clearNotification,
        clearAllNotifications,
        socket: socketRef,
    };
}
