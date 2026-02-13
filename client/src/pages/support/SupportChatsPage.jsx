import { Link } from 'react-router-dom';
import './SupportChatsPage.css';

export default function SupportChatsPage() {
    const template = `Тема: Повідомлення про помилку\n\n1) Що саме сталося:\n2) На якій сторінці:\n3) Коли помітили:\n4) Як відтворити:\n5) Скріншот/відео (за можливості):`;

    return (
        <div className="support-page">
            <div className="support-header">
                <h1>Знайшли помилку</h1>
                <p>Повідомте адміну через загальні чати підтримки або надішліть структурований звіт.</p>
            </div>

            <div className="support-grid">
                <section className="card support-card">
                    <h3>Загальні чати підтримки</h3>
                    <p>Використайте загальний чат, щоб швидко повідомити про проблему адміну.</p>
                    <div className="support-actions">
                        <a className="btn btn-primary" href="https://t.me/" target="_blank" rel="noreferrer">
                            Відкрити Telegram-чат
                        </a>
                        <a className="btn btn-secondary" href="https://discord.com/channels/@me" target="_blank" rel="noreferrer">
                            Відкрити Discord
                        </a>
                    </div>
                </section>

                <section className="card support-card">
                    <h3>Шаблон звернення</h3>
                    <p>Скопіюйте текст нижче і відправте адміну в чаті.</p>
                    <textarea className="support-template" readOnly value={template} rows={9} />
                </section>

                <section className="card support-card">
                    <h3>Додатково</h3>
                    <p>Якщо помилка пов'язана з конкретним обміном, відкрийте відповідний чат угоди.</p>
                    <div className="support-actions">
                        <Link to="/exchanges" className="btn btn-secondary">
                            Перейти до обмінів
                        </Link>
                        <Link to="/faq" className="btn btn-secondary">
                            Відкрити FAQ
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
