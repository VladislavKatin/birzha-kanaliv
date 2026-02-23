import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

function formatTime(value) {
    if (!value) return '--:--';
    return new Date(value).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

function toDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Не вдалося прочитати файл'));
        reader.readAsDataURL(file);
    });
}

export default function SupportPage() {
    const location = useLocation();
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

    const [threads, setThreads] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [text, setText] = useState('');
    const [imageData, setImageData] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadThreads();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestedUserId = params.get('userId');
        if (!requestedUserId) return;
        if (!threads.some((thread) => thread.user.id === requestedUserId)) return;
        if (selectedUserId === requestedUserId) return;
        loadMessages(requestedUserId);
    }, [location.search, threads, selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

    async function loadThreads() {
        setLoadingThreads(true);
        try {
            const response = await api.get('/admin/support/threads');
            const nextThreads = response.data.threads || [];
            setThreads(nextThreads);

            if (nextThreads.length > 0) {
                const requestedUserId = new URLSearchParams(location.search).get('userId');
                const nextUserId = requestedUserId && nextThreads.some((row) => row.user.id === requestedUserId)
                    ? requestedUserId
                    : (selectedUserId && nextThreads.some((row) => row.user.id === selectedUserId)
                        ? selectedUserId
                        : nextThreads[0].user.id);

                setSelectedUserId(nextUserId);
                await loadMessages(nextUserId);
            } else {
                setSelectedUserId('');
                setSelectedUser(null);
                setMessages([]);
            }
        } finally {
            setLoadingThreads(false);
        }
    }

    async function loadMessages(userId) {
        if (!userId) return;
        setLoadingMessages(true);

        try {
            const response = await api.get(`/admin/support/threads/${userId}/messages`);
            setSelectedUser(response.data.user || null);
            setMessages(response.data.messages || []);
            setSelectedUserId(userId);
        } finally {
            setLoadingMessages(false);
        }
    }

    async function handleAttach(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        setImageData(await toDataUrl(file));
    }

    async function handleSend() {
        if (!selectedUserId || sending) return;
        const content = text.trim();
        if (!content && !imageData) return;

        setSending(true);
        try {
            const response = await api.post(`/admin/support/threads/${selectedUserId}/messages`, {
                content,
                imageData: imageData || undefined,
            });
            setMessages((prev) => [...prev, response.data.message]);
            setText('');
            setImageData('');
            await loadThreads();
        } finally {
            setSending(false);
        }
    }

    const rows = useMemo(() => {
        const result = [];
        let prevDate = '';

        messages.forEach((message) => {
            const dateLabel = formatDate(message.createdAt);
            if (prevDate !== dateLabel) {
                prevDate = dateLabel;
                result.push({ type: 'date', id: `d-${dateLabel}`, dateLabel });
            }
            result.push({ type: 'message', ...message });
        });

        return result;
    }, [messages]);

    return (
        <section className="card support-shell">
            <div className="support-thread-list">
                <div className="card-head compact-head">
                    <h2>Чати користувачів</h2>
                    <button className="btn btn-secondary" onClick={loadThreads}>Оновити</button>
                </div>

                {loadingThreads ? <p className="empty-text">Завантаження...</p> : (
                    <div className="thread-items">
                        {threads.map((thread) => (
                            <button
                                key={thread.user.id}
                                className={`thread-item ${selectedUserId === thread.user.id ? 'active' : ''}`}
                                onClick={() => loadMessages(thread.user.id)}
                            >
                                <strong>{thread.user.displayName || thread.user.email}</strong>
                                <span>{thread.lastMessage || 'Без тексту'}</span>
                                <small>{formatTime(thread.lastMessageAt)}</small>
                            </button>
                        ))}
                        {threads.length === 0 ? <p className="empty-text">Поки немає звернень у підтримку.</p> : null}
                    </div>
                )}
            </div>

            <div className="support-chat-panel">
                {selectedUser ? (
                    <div className="support-chat-head">
                        <div>
                            <strong>{selectedUser.displayName || selectedUser.email}</strong>
                            <p>{selectedUser.email}</p>
                        </div>
                    </div>
                ) : <p className="empty-text">Оберіть діалог</p>}

                <div className="support-list admin-support-list">
                    {loadingMessages ? <p className="empty-text">Завантаження діалогу...</p> : rows.map((item) => {
                        if (item.type === 'date') {
                            return <div key={item.id} className="support-date">{item.dateLabel}</div>;
                        }

                        return (
                            <div key={item.id} className={`support-message ${item.isAdmin ? 'mine' : 'theirs'}`}>
                                <div className="support-bubble">
                                    <div className="support-author">{item.isAdmin ? 'Адміністратор' : (item.sender?.displayName || 'Користувач')}</div>
                                    {item.imageData ? <a href={item.imageData} target="_blank" rel="noreferrer"><img className="support-image" src={item.imageData} alt="Вкладення" /></a> : null}
                                    {item.content ? <p>{item.content}</p> : null}
                                    <small>{formatTime(item.createdAt)}</small>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {selectedUser ? (
                    <>
                        {imageData ? (
                            <div className="support-preview">
                                <img src={imageData} alt="preview" />
                                <button className="btn btn-secondary" onClick={() => setImageData('')}>Прибрати</button>
                            </div>
                        ) : null}

                        <div className="support-input-row">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={handleAttach}
                                style={{ display: 'none' }}
                            />
                            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Зображення</button>
                            <textarea
                                rows={2}
                                value={text}
                                placeholder="Напишіть відповідь користувачу..."
                                onChange={(event) => setText(event.target.value)}
                            />
                            <button className="btn btn-primary" disabled={sending || (!text.trim() && !imageData)} onClick={handleSend}>Надіслати</button>
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}
