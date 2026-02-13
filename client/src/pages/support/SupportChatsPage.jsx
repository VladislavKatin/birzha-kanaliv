import { Link } from 'react-router-dom';
import './SupportChatsPage.css';

export default function SupportChatsPage() {
    const bugTemplate = `Тема: Повідомлення про помилку\n\n1) Що саме сталося:\n2) На якій сторінці:\n3) Коли помітили:\n4) Як відтворити:\n5) Скріншот/відео (за можливості):`;

    return (
        <div className="support-page">
            <div className="support-header">
                <h1>Повідомлення</h1>
                <p>Єдиний розділ для чатів користувачів, обговорень у спільноті, звернень до адміністратора та майбутнього чату з розробниками.</p>
            </div>

            <div className="support-grid">
                <section className="card support-card">
                    <h3>Чати між користувачами</h3>
                    <p>Вся комунікація по обмінах зібрана в одному місці: вхідні, вихідні та активні угоди.</p>
                    <div className="support-actions">
                        <Link to="/swaps/incoming" className="btn btn-secondary">
                            Вхідні запити
                        </Link>
                        <Link to="/swaps/outgoing" className="btn btn-secondary">
                            Вихідні запити
                        </Link>
                        <Link to="/exchanges" className="btn btn-primary">
                            Активні обміни
                        </Link>
                    </div>
                </section>

                <section className="card support-card">
                    <h3>Загальні чати спільноти</h3>
                    <p>Спільні чати для пошуку партнерів, обговорення нових ідей і швидкої взаємодії між учасниками.</p>
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
                    <h3>Підтримка та помилки</h3>
                    <p>Якщо знайшли баг, надішліть адміну структурований звіт. Це прискорює перевірку і виправлення.</p>
                    <textarea className="support-template" readOnly value={bugTemplate} rows={9} />
                </section>

                <section className="card support-card">
                    <h3>Чат з розробниками</h3>
                    <p>У майбутньому буде окрема адмін-сторінка для керування проєктом і прямого зв'язку з командою.</p>
                    <div className="support-actions">
                        <button type="button" className="btn btn-secondary" disabled>
                            Скоро буде доступно
                        </button>
                    </div>
                </section>

                <section className="card support-card support-card-wide">
                    <h3>Швидкі переходи</h3>
                    <p>Корисні посилання для роботи з обмінами та каналами під час листування.</p>
                    <div className="support-actions">
                        <Link to="/dashboard/offers" className="btn btn-secondary">
                            Пропозиції
                        </Link>
                        <Link to="/my-channels" className="btn btn-secondary">
                            Мої канали
                        </Link>
                        <Link to="/faq" className="btn btn-secondary">
                            FAQ
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
