import { useEffect } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { applyJsonLd, applyPageSeo, buildFaqPageJsonLd } from '../../services/seo';
import './FaqPage.css';

const helpSections = [
    {
        title: 'Акаунт і доступ',
        items: [
            {
                q: 'Як увійти в сервіс?',
                a: 'Натисніть «Увійти» і авторизуйтеся через Google. Після входу відкривається дашборд користувача.',
            },
            {
                q: 'Як відновити доступ, якщо не працює вхід?',
                a: 'Перевірте браузерні cookie, дозволи pop-up для Google та повторіть вхід. Якщо проблема лишилася — напишіть у підтримку.',
            },
        ],
    },
    {
        title: 'Канали та пропозиції',
        items: [
            {
                q: 'Як канал потрапляє в каталог пропозицій?',
                a: 'Якщо канал активний у розділі «Мої канали», він автоматично відображається у каталозі.',
            },
            {
                q: 'Чому я бачу DEMO-канали?',
                a: 'DEMO-канали позначені окремо для демонстрації сценаріїв. Реальні канали відображаються вище у списку.',
            },
        ],
    },
    {
        title: 'Обміни та безпека',
        items: [
            {
                q: 'Як завершується угода?',
                a: 'Обидві сторони мають підтвердити обмін. Після цього угода переходить у завершений статус і доступний відгук.',
            },
            {
                q: 'Що робити при підозрі на порушення?',
                a: 'Перейдіть у «Знайшли помилку» або чат підтримки та додайте деталі, за потреби — скриншоти.',
            },
        ],
    },
];

export default function HelpPage() {
    useEffect(() => {
        applyPageSeo({
            title: 'Help Center — Біржа Каналів',
            description: 'Довідковий центр Біржа Каналів: відповіді про акаунт, канали, обміни, безпеку та підтримку.',
            keywords: ['help center', 'довідка біржа каналів', 'підтримка youtube обмін'],
            path: '/help',
            type: 'website',
        });

        const faqItems = helpSections.flatMap((section) => section.items);
        applyJsonLd('help-page-faq-schema', buildFaqPageJsonLd(faqItems, '/help'));
    }, []);

    return (
        <PublicLayout>
            <section className="faq-page">
                <div className="faq-page-inner">
                    <header className="faq-page-header">
                        <h1>Help Center</h1>
                        <p>Операційні інструкції та відповіді на ключові питання по роботі платформи.</p>
                    </header>

                    <div className="faq-page-list">
                        {helpSections.map((section) => (
                            <section key={section.title}>
                                <h2 style={{ marginBottom: 12 }}>{section.title}</h2>
                                {section.items.map((item) => (
                                    <details key={item.q} className="faq-page-item">
                                        <summary>{item.q}</summary>
                                        <p>{item.a}</p>
                                    </details>
                                ))}
                            </section>
                        ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
