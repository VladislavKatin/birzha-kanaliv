import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';
import './ChatPage.css';

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
}

export default function ChatPage() {
    const { transactionId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const { connected, messages: socketMessages, setMessages, typingUsers, sendMessage, sendTyping } = useSocket(transactionId);

    const [chatData, setChatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
        loadChat();
    }, [transactionId]);

    useEffect(() => {
        scrollToBottom();
    }, [socketMessages]);

    async function loadChat() {
        try {
            const res = await api.get(`/chat/${transactionId}/messages`);
            setChatData(res.data);
            setMessages(res.data.messages || []);
        } catch (error) {
            console.error('Failed to load chat:', error);
            toast.error('Не вдалося завантажити чат');
        } finally {
            setLoading(false);
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    async function handleSend() {
        const content = inputValue.trim();
        if (!content || sending) return;

        setSending(true);
        setInputValue('');

        if (connected) {
            sendMessage(content);
            sendTyping(false);
        } else {
            // Fallback to REST
            try {
                const res = await api.post(`/chat/${transactionId}/messages`, { content });
                setMessages(prev => [...prev, res.data.message]);
            } catch (error) {
                toast.error('Не вдалося надіслати повідомлення');
                setInputValue(content);
            }
        }
        setSending(false);
        inputRef.current?.focus();
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleInputChange(e) {
        setInputValue(e.target.value);
        // Typing indicator
        sendTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
    }

    async function handleComplete() {
        try {
            const res = await api.post(`/chat/${transactionId}/complete`);
            setChatData(prev => ({ ...prev, match: res.data.match }));
            if (res.data.match.status === 'completed') {
                toast.success('🎉 Обмін завершено! Тепер можете залишити відгук.');
            } else {
                toast.success('Ви підтвердили завершення. Чекаємо на партнера.');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Не вдалося підтвердити');
        }
    }

    if (loading) {
        return (
            <div className="chat-loading">
                <div className="loading-pulse" />
                <p>Завантаження чату...</p>
            </div>
        );
    }

    if (!chatData) {
        return (
            <div className="chat-error">
                <h3>Чат не знайдено</h3>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← На головну
                </button>
            </div>
        );
    }

    const { partner, match, myUserId } = chatData;
    const isTyping = Object.values(typingUsers).some(v => v);
    const isCompleted = match?.status === 'completed';
    const myConfirmed = match?.initiatorConfirmed || match?.targetConfirmed; // simplified

    // Group messages by date
    const messageGroups = [];
    let lastDate = '';
    for (const msg of socketMessages) {
        const date = formatDate(msg.createdAt);
        if (date !== lastDate) {
            messageGroups.push({ type: 'date', date });
            lastDate = date;
        }
        messageGroups.push({ type: 'message', ...msg });
    }

    return (
        <div className="chat-page">
            {/* Header */}
            <div className="chat-header">
                <button className="btn-back" onClick={() => navigate(-1)}>←</button>
                <div className="chat-header-partner">
                    <img
                        src={partner?.channelAvatar || partner?.owner?.photoURL || ''}
                        alt=""
                        className="chat-partner-avatar"
                    />
                    <div className="chat-partner-info">
                        <span className="chat-partner-name">
                            {partner?.channelTitle || partner?.owner?.displayName || 'Партнер'}
                        </span>
                        <span className="chat-partner-status">
                            {connected ? (isTyping ? 'друкує...' : '🟢 Онлайн') : '⚪ Офлайн'}
                        </span>
                    </div>
                </div>
                <div className="chat-header-actions">
                    {match?.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" onClick={handleComplete}>
                            ✅ Підтвердити виконання
                        </button>
                    )}
                    {isCompleted && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/exchanges')}>
                            ⭐ Залишити відгук
                        </button>
                    )}
                </div>
            </div>

            {/* Disclaimer banner */}
            <div className="chat-disclaimer">
                <span>⚠️ Не передавайте паролі та реквізити. Уся комунікація лише через платформу.</span>
                <button className="disclaimer-more" onClick={() => setShowDisclaimer(true)}>Детальніше</button>
            </div>

            {/* Status bar */}
            {match && (
                <div className={`chat-status-bar ${isCompleted ? 'completed' : ''}`}>
                    {isCompleted ? (
                        <span>✅ Обмін завершено! Обидві сторони підтвердили.</span>
                    ) : match.status === 'accepted' ? (
                        <span>🤝 Обмін прийнято. Домовтесь про деталі в чаті, потім підтвердіть виконання.</span>
                    ) : (
                        <span>📌 Статус: {match.status}</span>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="chat-messages">
                {messageGroups.length === 0 ? (
                    <div className="chat-empty">
                        <span className="chat-empty-icon">💬</span>
                        <p>Напишіть перше повідомлення!</p>
                    </div>
                ) : (
                    messageGroups.map((item, i) => {
                        if (item.type === 'date') {
                            return (
                                <div key={`date-${i}`} className="chat-date-divider">
                                    <span>{item.date}</span>
                                </div>
                            );
                        }
                        const isMine = item.sender?.id === myUserId || item.senderUserId === myUserId;
                        return (
                            <div key={item.id} className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
                                {!isMine && (
                                    <img
                                        src={item.sender?.photoURL || ''}
                                        alt=""
                                        className="chat-msg-avatar"
                                    />
                                )}
                                <div className="chat-msg-bubble">
                                    <p className="chat-msg-text">{item.content}</p>
                                    <span className="chat-msg-time">{formatTime(item.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                {isTyping && (
                    <div className="chat-typing">
                        <span className="typing-dots"><span /><span /><span /></span>
                        <span>друкує...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!isCompleted && (
                <div className="chat-input-bar">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Напишіть повідомлення..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sending}
                    >
                        ➤
                    </button>
                </div>
            )}

            {/* Disclaimer Modal */}
            {showDisclaimer && (
                <div className="modal-overlay" onClick={() => setShowDisclaimer(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Правила безпеки</h3>
                        <ul className="disclaimer-list">
                            <li>Ніколи не передавайте паролі від каналу</li>
                            <li>Не діліться банківськими реквізитами</li>
                            <li>Будь-які домовленості мають бути в межах платформи</li>
                            <li>Підозрілу активність повідомляйте адміністрації</li>
                            <li>Обмін має бути взаємовигідним і чесним</li>
                        </ul>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setShowDisclaimer(false)}>
                                Зрозуміло
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
