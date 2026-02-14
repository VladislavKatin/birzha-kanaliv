import { useEffect, useRef, useState, useCallback } from 'react';
import { auth } from '../services/firebase';
import { createAuthenticatedSocket } from '../services/socket';

/**
 * Global socket hook for app-wide events: notifications, presence, swap status.
 * Unlike useSocket (per-match chat), this connects once for the entire session.
 *
 * @returns {{ connected, notifications, onlineUsers, clearNotification }}
 */
export default function useGlobalSocket() {
    const socketRef = useRef(null);
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
                setNotifications(prev => [notification, ...prev].slice(0, 50));
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
        connect();
        return () => disconnect();
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
