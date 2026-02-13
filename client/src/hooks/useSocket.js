import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { auth } from '../services/firebase';

export default function useSocket(matchId) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});

    const connect = useCallback(async () => {
        if (socketRef.current?.connected) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            const socket = io(window.location.origin, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            socket.on('connect', () => {
                setConnected(true);
                socket.emit('join:transaction', matchId);
            });

            socket.on('disconnect', () => setConnected(false));

            socket.on('new:message', (message) => {
                setMessages(prev => {
                    // Deduplicate
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            });

            socket.on('typing', (data) => {
                setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
                // Auto-clear typing after 3s
                if (data.isTyping) {
                    setTimeout(() => {
                        setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
                    }, 3000);
                }
            });

            socket.on('error', (err) => {
                console.error('Socket error:', err.message);
            });

            socketRef.current = socket;
        } catch (error) {
            console.error('Socket connection failed:', error);
        }
    }, [matchId]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnected(false);
        }
    }, []);

    const sendMessage = useCallback((content) => {
        if (socketRef.current?.connected && content.trim()) {
            socketRef.current.emit('send:message', { matchId, content });
        }
    }, [matchId]);

    const sendTyping = useCallback((isTyping) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing', { isTyping });
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        connected,
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        sendTyping,
    };
}
