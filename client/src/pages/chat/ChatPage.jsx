import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';
import './ChatPage.css';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Не вдалося прочитати зображення'));
        reader.readAsDataURL(file);
    });
}

export default function ChatPage() {
    const { transactionId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const {
        connected,
        messages: socketMessages,
        setMessages,
        typingUsers,
        sendMessage,
        sendTyping,
    } = useSocket(transactionId);

    const [chatData, setChatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
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
            const response = await api.get(`/chat/${transactionId}/messages`);
            setChatData(response.data);
            setMessages(response.data.messages || []);
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

    async function handleFilePick(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            if (!file.type.startsWith('image/')) {
                toast.error('Можна надсилати лише зображення');
                return;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                toast.error('Зображення має бути до 3MB');
                return;
            }

            const dataUrl = await fileToDataUrl(file);
            setSelectedImage(dataUrl);
        } catch (error) {
            toast.error(error.message || 'Не вдалося додати зображення');
        } finally {
            event.target.value = '';
        }
    }

    function clearSelectedImage() {
        setSelectedImage('');
    }

    async function handleSend() {
        const content = inputValue.trim();
        const imageData = selectedImage;
        if ((!content && !imageData) || sending) return;

        setSending(true);
        setInputValue('');
        setSelectedImage('');

        const payload = { content, imageData };

        if (connected) {
            sendMessage(payload);
            sendTyping(false);
        } else {
            try {
                const response = await api.post(`/chat/${transactionId}/messages`, payload);
                setMessages((prev) => [...prev, response.data.message]);
            } catch (error) {
                toast.error(error.response?.data?.error || 'Не вдалося надіслати повідомлення');
                setInputValue(content);
                setSelectedImage(imageData);
            }
        }

        setSending(false);
        inputRef.current?.focus();
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    }

    function handleInputChange(event) {
        setInputValue(event.target.value);
        sendTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
    }

    async function handleComplete() {
        try {
            const response = await api.post(`/chat/${transactionId}/complete`);
            setChatData((prev) => ({ ...prev, match: response.data.match }));

            if (response.data.match.status === 'completed') {
                toast.success('Обмін завершено. Можете залишити відгук.');
            } else {
                toast.success('Підтверджено. Очікуємо підтвердження партнера.');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Не вдалося підтвердити завершення');
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
                    Назад
                </button>
            </div>
        );
    }

    const { partner, match, myUserId } = chatData;
    const isTyping = Object.values(typingUsers).some(Boolean);
    const isCompleted = match?.status === 'completed';

    const messageGroups = [];
    let lastDate = '';
    for (const message of socketMessages) {
        const date = formatDate(message.createdAt);
        if (date !== lastDate) {
            messageGroups.push({ type: 'date', date });
            lastDate = date;
        }
        messageGroups.push({ type: 'message', ...message });
    }

    return (
        <div className="chat-page">
            <div className="chat-header">
                <button className="btn-back" onClick={() => navigate(-1)}>←</button>
                <div className="chat-header-partner">
                    <img
                        src={partner?.channelAvatar || partner?.owner?.photoURL || ''}
                        alt=""
                        className="chat-partner-avatar"
                    />
                    <div className="chat-partner-info">
                        <span className="chat-partner-name">{partner?.channelTitle || partner?.owner?.displayName || 'Партнер'}</span>
                        <span className="chat-partner-status">{connected ? (isTyping ? 'друкує...' : 'Онлайн') : 'Офлайн'}</span>
                    </div>
                </div>
                <div className="chat-header-actions">
                    {match?.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" onClick={handleComplete}>
                            Підтвердити виконання
                        </button>
                    )}
                    {isCompleted && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/exchanges')}>
                            Залишити відгук
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-disclaimer">
                <span>Не передавайте паролі чи платіжні дані. Всі домовленості тільки в межах платформи.</span>
                <button className="disclaimer-more" onClick={() => setShowDisclaimer(true)}>Детальніше</button>
            </div>

            {match && (
                <div className={`chat-status-bar ${isCompleted ? 'completed' : ''}`}>
                    {isCompleted ? (
                        <span>Обмін завершено.</span>
                    ) : match.status === 'accepted' ? (
                        <span>Обмін прийнято. Домовтеся в чаті та підтвердіть виконання.</span>
                    ) : (
                        <span>Статус: {match.status}</span>
                    )}
                </div>
            )}

            <div className="chat-messages">
                {messageGroups.length === 0 ? (
                    <div className="chat-empty">
                        <span className="chat-empty-icon">💬</span>
                        <p>Напишіть перше повідомлення</p>
                    </div>
                ) : (
                    messageGroups.map((item, index) => {
                        if (item.type === 'date') {
                            return (
                                <div key={`date-${index}`} className="chat-date-divider">
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
                                    {item.imageData && (
                                        <a href={item.imageData} target="_blank" rel="noreferrer" className="chat-msg-image-link">
                                            <img src={item.imageData} alt="Вкладене зображення" className="chat-msg-image" />
                                        </a>
                                    )}
                                    {item.content && <p className="chat-msg-text">{item.content}</p>}
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

            {!isCompleted && (
                <div className="chat-input-bar">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFilePick}
                        style={{ display: 'none' }}
                    />

                    <button
                        type="button"
                        className="chat-attach-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Додати зображення"
                    >
                        🖼
                    </button>

                    <div className="chat-input-stack">
                        {selectedImage && (
                            <div className="chat-image-preview">
                                <img src={selectedImage} alt="Попередній перегляд" />
                                <button type="button" onClick={clearSelectedImage}>✕</button>
                            </div>
                        )}

                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            placeholder="Напишіть повідомлення..."
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                    </div>

                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={(!inputValue.trim() && !selectedImage) || sending}
                    >
                        ➤
                    </button>
                </div>
            )}

            {showDisclaimer && (
                <div className="modal-overlay" onClick={() => setShowDisclaimer(false)}>
                    <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                        <h3>Правила безпеки</h3>
                        <ul className="disclaimer-list">
                            <li>Не передавайте паролі від акаунтів</li>
                            <li>Не надсилайте платіжні реквізити</li>
                            <li>Всі умови фіксуйте в чаті платформи</li>
                            <li>Підозрілі дії одразу повідомляйте адміністрації</li>
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
