import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

function formatTime(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
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
    const listEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [myUserId, setMyUserId] = useState('');
    const [text, setText] = useState('');
    const [imageData, setImageData] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadMessages();
    }, []);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadMessages() {
        setLoading(true);
        try {
            const response = await api.get('/support/chat');
            const initial = [response.data.adminWelcome, ...(response.data.messages || [])];
            setMessages(initial);
            setMyUserId(response.data.myUserId || '');
        } finally {
            setLoading(false);
        }
    }

    async function handleFile(event) {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            event.target.value = '';
            return;
        }

        try {
            const dataUrl = await toDataUrl(file);
            setImageData(dataUrl);
        } finally {
            event.target.value = '';
        }
    }

    async function handleSend() {
        const content = text.trim();
        if ((!content && !imageData) || sending) return;

        setSending(true);
        try {
            const response = await api.post('/support/chat/messages', {
                content,
                imageData: imageData || undefined,
            });
            setMessages((prev) => [...prev, response.data.message]);
            setText('');
            setImageData('');
        } finally {
            setSending(false);
        }
    }

    const grouped = useMemo(() => {
        const visible = messages.filter((message) => message.isAdmin || message.sender?.id === myUserId || message.isSystem);
        const rows = [];
        let prevDate = '';

        visible.forEach((item) => {
            const dateLabel = formatDate(item.createdAt);
            if (dateLabel !== prevDate) {
                rows.push({ type: 'date', id: `date-${dateLabel}`, date: dateLabel });
                prevDate = dateLabel;
            }
            rows.push({ type: 'message', ...item });
        });

        return rows;
    }, [messages, myUserId]);

    return (
        <section className="card support-card">
            <div className="card-head">
                <h2>Чат підтримки</h2>
                <button className="btn btn-secondary" onClick={loadMessages}>Оновити</button>
            </div>

            {loading ? (
                <p className="empty-text">Завантаження чату...</p>
            ) : (
                <>
                    <div className="support-list">
                        {grouped.map((item) => {
                            if (item.type === 'date') {
                                return <div key={item.id} className="support-date">{item.date}</div>;
                            }

                            const mine = item.sender?.id === myUserId;
                            return (
                                <div key={item.id} className={`support-message ${mine ? 'mine' : 'theirs'}`}>
                                    <div className="support-bubble">
                                        <div className="support-author">
                                            {item.isAdmin ? 'Адміністрація' : (mine ? 'Ви' : item.sender?.displayName || 'Користувач')}
                                        </div>
                                        {item.imageData && (
                                            <a href={item.imageData} target="_blank" rel="noreferrer">
                                                <img src={item.imageData} alt="Вкладення" className="support-image" />
                                            </a>
                                        )}
                                        {item.content ? <p>{item.content}</p> : null}
                                        <small>{formatTime(item.createdAt)}</small>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={listEndRef} />
                    </div>

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
                            onChange={handleFile}
                            style={{ display: 'none' }}
                        />
                        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Додати зображення</button>
                        <textarea
                            rows={2}
                            placeholder="Напишіть повідомлення користувачам..."
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleSend} disabled={sending || (!text.trim() && !imageData)}>
                            Надіслати
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
