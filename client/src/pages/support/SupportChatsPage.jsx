import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { isThreadUnread, markThreadSeen } from '../../services/menuBadges';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './SupportChatsPage.css';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

function formatTime(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Не вдалося прочитати файл'));
        reader.readAsDataURL(file);
    });
}

function getThreadTitle(thread) {
    if (thread.type === 'support') return 'Адміністрація';
    return thread.partner?.channelTitle || 'Чат користувача';
}

function getThreadSubtitle(thread) {
    if (thread.type === 'support') return 'Підтримка та повідомлення про помилки';
    const statusMap = {
        pending: 'Очікує підтвердження',
        accepted: 'Активний обмін',
        completed: 'Завершений обмін',
    };
    return statusMap[thread.status] || 'Обмін';
}

function getThreadAvatar(thread) {
    if (thread.type === 'support') {
        return { image: '', fallback: 'A' };
    }

    const title = thread.partner?.channelTitle || 'Канал';
    const image = resolveChannelAvatar(thread.partner?.channelAvatar, title);
    const fallback = buildFallbackAvatar(title);
    return { image, fallback };
}

export default function SupportChatsPage() {
    const location = useLocation();
    const fileInputRef = useRef(null);
    const listEndRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [threads, setThreads] = useState([]);
    const [activeThreadId, setActiveThreadId] = useState('support');
    const [messages, setMessages] = useState([]);
    const [myUserId, setMyUserId] = useState('');
    const [supportCache, setSupportCache] = useState({ adminWelcome: null, messages: [] });
    const [inputValue, setInputValue] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [threadSearch, setThreadSearch] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);

    const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) || null, [threads, activeThreadId]);
    const filteredThreads = useMemo(() => {
        const query = threadSearch.trim().toLowerCase();
        return threads
            .filter((thread) => {
                const unread = isThreadUnread(thread, { myUserId });
                if (unreadOnly && !unread) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const haystack = [
                    getThreadTitle(thread),
                    getThreadSubtitle(thread),
                    thread.lastMessage?.content || '',
                ]
                    .join(' ')
                    .toLowerCase();

                return haystack.includes(query);
            })
            .sort((left, right) => {
                if (left.type === 'support' && right.type !== 'support') return -1;
                if (right.type === 'support' && left.type !== 'support') return 1;

                const leftTime = new Date(left.lastMessageAt || left.lastMessage?.createdAt || 0).getTime();
                const rightTime = new Date(right.lastMessageAt || right.lastMessage?.createdAt || 0).getTime();
                return rightTime - leftTime;
            });
    }, [threads, threadSearch, unreadOnly, myUserId]);

    useEffect(() => {
        loadInitialData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const prefill = params.get('prefill');
        const requestedThread = params.get('thread');
        if (prefill) {
            setInputValue(prefill);
            if (!requestedThread) {
                setActiveThreadId('support');
            }
        }
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestedThread = params.get('thread');
        if (!requestedThread) return;
        if (threads.some((thread) => thread.id === requestedThread)) {
            setActiveThreadId(requestedThread);
        }
    }, [location.search, threads]);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!activeThread) return;
        const latestMessage = [...messages]
            .sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime())
            .at(-1);
        if (!latestMessage) return;

        markThreadSeen({
            id: activeThread.id,
            lastMessage: latestMessage,
            lastMessageAt: latestMessage.createdAt,
        });
    }, [activeThread, messages]);

    useEffect(() => {
        if (!activeThread) return;
        loadThreadMessages(activeThread);
    }, [activeThread]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        function handleSupportMessage(event) {
            const incoming = event.detail;
            if (!incoming?.id) return;

            setSupportCache((prev) => {
                if (prev.messages.some((item) => item.id === incoming.id)) {
                    return prev;
                }
                return { ...prev, messages: [...prev.messages, incoming] };
            });

            setThreads((prev) => prev.map((thread) => {
                if (thread.id !== 'support') return thread;
                return { ...thread, lastMessage: incoming, lastMessageAt: incoming.createdAt };
            }));

            if (activeThreadId === 'support') {
                setMessages((prev) => {
                    if (prev.some((item) => item.id === incoming.id)) return prev;
                    return [...prev, incoming];
                });
            }
        }

        window.addEventListener('support:message', handleSupportMessage);
        return () => window.removeEventListener('support:message', handleSupportMessage);
    }, [activeThreadId]);

    async function loadInitialData() {
        setLoading(true);
        try {
            const [supportResponse, threadsResponse] = await Promise.all([
                api.get('/support/chat'),
                api.get('/chat/threads'),
            ]);

            const supportMessages = [supportResponse.data.adminWelcome, ...(supportResponse.data.messages || [])];
            setMyUserId(supportResponse.data.myUserId || '');
            setSupportCache({
                adminWelcome: supportResponse.data.adminWelcome,
                messages: supportResponse.data.messages || [],
            });

            const supportLast = supportMessages[supportMessages.length - 1] || supportResponse.data.adminWelcome;
            const matchThreads = (threadsResponse.data.threads || []).map((thread) => ({
                ...thread,
                lastMessage: thread.lastMessage || null,
                lastMessageAt: thread.lastMessageAt || thread.lastMessage?.createdAt || new Date().toISOString(),
            }));

            const nextThreads = [
                {
                    id: 'support',
                    type: 'support',
                    lastMessage: supportLast,
                    lastMessageAt: supportLast?.createdAt || new Date(0).toISOString(),
                },
                ...matchThreads,
            ];

            setThreads(nextThreads);
            if (!nextThreads.some((thread) => thread.id === activeThreadId)) {
                setActiveThreadId(nextThreads[0]?.id || 'support');
            }
        } catch (error) {
            console.error('Failed to load messages workspace:', error);
            toast.error(getApiErrorMessage(error, 'Не вдалося завантажити повідомлення.'));
            setThreads([{ id: 'support', type: 'support', lastMessage: null, lastMessageAt: new Date(0).toISOString() }]);
            setActiveThreadId('support');
        } finally {
            setLoading(false);
        }
    }

    async function loadThreadMessages(thread) {
        setLoadingMessages(true);
        try {
            if (thread.type === 'support') {
                const supportMessages = [supportCache.adminWelcome, ...(supportCache.messages || [])].filter(Boolean);
                setMessages(supportMessages);
                return;
            }

            const response = await api.get(`/chat/${thread.matchId}/messages`);
            setMessages(response.data.messages || []);
            if (response.data.myUserId) {
                setMyUserId(response.data.myUserId);
            }
        } catch (error) {
            console.error('Failed to load thread messages:', error);
            toast.error(getApiErrorMessage(error, 'Не вдалося завантажити чат.'));
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }

    async function handlePickImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            if (!file.type.startsWith('image/')) {
                toast.error('Можна додавати лише зображення.');
                return;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                toast.error('Максимальний розмір зображення: 3 MB.');
                return;
            }
            const dataUrl = await fileToDataUrl(file);
            setSelectedImage(dataUrl);
        } catch (error) {
            console.error(error);
            toast.error('Не вдалося обробити зображення.');
        } finally {
            event.target.value = '';
        }
    }

    async function handleSend() {
        const content = inputValue.trim();
        if ((!content && !selectedImage) || sending || !activeThread) return;

        setSending(true);
        const payload = {
            content,
            imageData: selectedImage || undefined,
        };

        try {
            let message = null;

            if (activeThread.type === 'support') {
                const response = await api.post('/support/chat/messages', payload);
                message = response.data.message;

                setSupportCache((prev) => ({
                    ...prev,
                    messages: prev.messages.some((item) => item.id === message.id)
                        ? prev.messages
                        : [...prev.messages, message],
                }));
            } else {
                const response = await api.post(`/chat/${activeThread.matchId}/messages`, payload);
                message = response.data.message;
            }

            if (message) {
                setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
                setThreads((prev) => prev.map((thread) => {
                    if (thread.id !== activeThread.id) return thread;
                    return { ...thread, lastMessage: message, lastMessageAt: message.createdAt || new Date().toISOString() };
                }));
            }

            setInputValue('');
            setSelectedImage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error(getApiErrorMessage(error, 'Не вдалося надіслати повідомлення.'));
        } finally {
            setSending(false);
        }
    }

    const groupedMessages = useMemo(() => {
        const result = [];
        let lastDate = '';
        for (const message of messages) {
            const date = formatDate(message.createdAt);
            if (date !== lastDate) {
                result.push({ type: 'date', id: `date-${date}`, date });
                lastDate = date;
            }
            result.push({ type: 'message', ...message });
        }
        return result;
    }, [messages]);

    return (
        <div className="support-page">
            <div className="support-header">
                <h1>Повідомлення</h1>
                <p>Усі переписки в одному місці. Обирайте чат ліворуч і швидко перемикайтеся між діалогами.</p>
            </div>

            <section className="card support-workspace">
                {loading ? (
                    <div className="support-chat-empty">Завантаження чатів...</div>
                ) : (
                    <>
                        <aside className="support-thread-list" aria-label="Список чатів">
                            <div className="support-thread-tools">
                                <input
                                    type="text"
                                    className="support-thread-search"
                                    placeholder="Пошук чату..."
                                    value={threadSearch}
                                    onChange={(event) => setThreadSearch(event.target.value)}
                                />
                                <label className="support-unread-toggle">
                                    <input
                                        type="checkbox"
                                        checked={unreadOnly}
                                        onChange={(event) => setUnreadOnly(event.target.checked)}
                                    />
                                    <span>Тільки непрочитані</span>
                                </label>
                            </div>

                            {filteredThreads.map((thread) => {
                                const active = thread.id === activeThreadId;
                                const unread = !active && isThreadUnread(thread, { myUserId });
                                const avatar = getThreadAvatar(thread);
                                return (
                                    <button
                                        key={thread.id}
                                        type="button"
                                        className={`support-thread-item ${active ? 'active' : ''} ${unread ? 'unread' : ''}`}
                                        onClick={() => setActiveThreadId(thread.id)}
                                    >
                                        {avatar.image ? (
                                            <img src={avatar.image} data-fallback-src={avatar.fallback} onError={handleAvatarError} alt={getThreadTitle(thread)} className="support-thread-avatar" />
                                        ) : (
                                            <span className="support-thread-avatar support-thread-avatar-fallback">{avatar.fallback}</span>
                                        )}
                                        <span className="support-thread-meta">
                                            <strong>
                                                {getThreadTitle(thread)}
                                                {unread && <span className="support-thread-unread-dot" aria-label="Непрочитано" />}
                                            </strong>
                                            <small>{getThreadSubtitle(thread)}</small>
                                            <em>{thread.lastMessage?.content || (thread.type === 'support' ? 'Напишіть адміністрації' : 'Відкрийте чат')}</em>
                                        </span>
                                    </button>
                                );
                            })}
                            {filteredThreads.length === 0 && (
                                <div className="support-threads-empty">
                                    Нічого не знайдено за цими умовами.
                                </div>
                            )}
                        </aside>

                        <div className="support-chat-panel">
                            <div className="support-chat-topbar">
                                <h2>{activeThread ? getThreadTitle(activeThread) : 'Чат'}</h2>
                                <span>{activeThread ? getThreadSubtitle(activeThread) : ''}</span>
                            </div>

                            <div className="support-chat-list">
                                {loadingMessages ? (
                                    <div className="support-chat-empty">Завантаження повідомлень...</div>
                                ) : groupedMessages.length === 0 ? (
                                    <div className="support-chat-empty">Повідомлень поки немає.</div>
                                ) : (
                                    groupedMessages.map((item) => {
                                        if (item.type === 'date') {
                                            return (
                                                <div key={item.id} className="support-chat-date">
                                                    <span>{item.date}</span>
                                                </div>
                                            );
                                        }

                                        const mine = item.sender?.id === myUserId;
                                        return (
                                            <div key={item.id} className={`support-chat-message ${mine ? 'mine' : 'theirs'}`}>
                                                <div className="support-chat-bubble">
                                                    <div className="support-chat-author">
                                                        {mine ? 'Ви' : (item.isAdmin ? 'Адміністрація' : (item.sender?.displayName || 'Користувач'))}
                                                        {item.isAdmin && <span className="support-chat-role">ADMIN</span>}
                                                    </div>
                                                    {item.imageData && (
                                                        <a href={item.imageData} target="_blank" rel="noreferrer" className="support-chat-image-link">
                                                            <img src={item.imageData} alt="Вкладення" className="support-chat-image" />
                                                        </a>
                                                    )}
                                                    {item.content && <p>{item.content}</p>}
                                                    <div className="support-chat-time">{formatTime(item.createdAt)}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={listEndRef} />
                            </div>

                            <div className="support-chat-input-wrap">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={handlePickImage}
                                    style={{ display: 'none' }}
                                />

                                {selectedImage && (
                                    <div className="support-chat-preview">
                                        <img src={selectedImage} alt="Preview" />
                                        <button type="button" onClick={() => setSelectedImage('')}>x</button>
                                    </div>
                                )}

                                <div className="support-chat-controls">
                                    <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                        Додати зображення
                                    </button>
                                    <textarea
                                        className="support-chat-input"
                                        rows={2}
                                        value={inputValue}
                                        onChange={(event) => setInputValue(event.target.value)}
                                        placeholder={activeThread?.type === 'support' ? 'Напишіть повідомлення адміністрації...' : 'Напишіть повідомлення користувачу...'}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSend}
                                        disabled={sending || (!inputValue.trim() && !selectedImage)}
                                    >
                                        Надіслати
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}












