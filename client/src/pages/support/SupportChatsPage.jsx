import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import './SupportChatsPage.css';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

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

export default function SupportChatsPage() {
    const fileInputRef = useRef(null);
    const listEndRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [myUserId, setMyUserId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadSupportChat();
    }, []);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadSupportChat() {
        try {
            const response = await api.get('/support/chat');
            setMyUserId(response.data.myUserId);
            const initial = [response.data.adminWelcome, ...(response.data.messages || [])];
            setMessages(initial);
        } catch (error) {
            console.error('Failed to load support chat:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handlePickImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            if (!file.type.startsWith('image/')) {
                return;
            }
            if (file.size > MAX_IMAGE_BYTES) {
                return;
            }
            const dataUrl = await fileToDataUrl(file);
            setSelectedImage(dataUrl);
        } catch (error) {
            console.error(error);
        } finally {
            event.target.value = '';
        }
    }

    async function handleSend() {
        const content = inputValue.trim();
        if ((!content && !selectedImage) || sending) return;

        setSending(true);
        const payload = {
            content,
            imageData: selectedImage || undefined,
        };

        try {
            const response = await api.post('/support/chat/messages', payload);
            setMessages((prev) => [...prev, response.data.message]);
            setInputValue('');
            setSelectedImage('');
        } catch (error) {
            console.error('Failed to send support message:', error);
        } finally {
            setSending(false);
        }
    }

    const grouped = useMemo(() => {
        const result = [];
        let lastDate = '';
        for (const message of messages) {
            const date = formatDate(message.createdAt);
            if (date !== lastDate) {
                result.push({ type: 'date', date, id: `date-${date}` });
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
                <p>Єдиний чат з адміністрацією: опишіть помилку або питання, додайте скріншот і надішліть повідомлення.</p>
            </div>

            <section className="card support-chat-card">
                {loading ? (
                    <div className="support-chat-empty">Завантаження чату...</div>
                ) : (
                    <>
                        <div className="support-chat-list">
                            {grouped.map((item) => {
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
                                            <div className="support-chat-author">{item.sender?.displayName || 'Користувач'}</div>
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
                            })}
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
                                    <button type="button" onClick={() => setSelectedImage('')}>✕</button>
                                </div>
                            )}

                            <div className="support-chat-controls">
                                <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                    Додати скріншот
                                </button>
                                <textarea
                                    className="support-chat-input"
                                    rows={2}
                                    value={inputValue}
                                    onChange={(event) => setInputValue(event.target.value)}
                                    placeholder="Напишіть повідомлення адміністрації..."
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
                    </>
                )}
            </section>
        </div>
    );
}
