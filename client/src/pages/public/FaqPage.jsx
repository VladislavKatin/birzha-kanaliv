import { useEffect } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { applyJsonLd, applyPageSeo, buildFaqPageJsonLd } from '../../services/seo';
import './FaqPage.css';

const faqItems = [
    {
        q: 'Що таке Біржа Каналів?',
        a: 'Це платформа для безпечного обміну аудиторією між YouTube-каналами з контролем статусів і репутації.',
    },
    {
        q: 'Чи можна переглядати пропозиції без реєстрації?',
        a: 'Так. Гості можуть переглядати каталог і деталі пропозицій. Для відгуку на пропозицію потрібна авторизація.',
    },
    {
        q: 'Як підключити канал?',
        a: 'Увійдіть у кабінет і натисніть "Підключити канал". Далі підтвердіть доступ через OAuth YouTube.',
    },
    {
        q: 'Як працює безпека обміну?',
        a: 'Обмін проходить через двостороннє підтвердження. В історії фіксується статус і подальші відгуки.',
    },
    {
        q: 'Де повідомити про проблему?',
        a: 'У кабінеті відкрийте розділ "Знайшли помилку" у верхній панелі. Там є інструкція для звернення до адміністратора.',
    },
    {
        q: 'Чи буде чат з розробниками?',
        a: 'Так, заплановано окрему адмін-сторінку для керування проєктом і спілкування з командою розробки.',
    },
];

export default function FaqPage() {
    useEffect(() => {
        applyPageSeo({
            title: 'FAQ — Біржа Каналів',
            description: 'Поширені запитання про роботу Біржа Каналів: реєстрація, обмін, безпека, підтримка та підключення YouTube.',
            keywords: ['faq біржа каналів', 'питання та відповіді', 'youtube обмін', 'допомога'],
            path: '/faq',
            type: 'website',
        });
        applyJsonLd('faq-page-schema', buildFaqPageJsonLd(faqItems, '/faq'));
    }, []);

    return (
        <PublicLayout>
            <section className="faq-page">
                <div className="faq-page-inner">
                    <header className="faq-page-header">
                        <h1>FAQ</h1>
                        <p>Відповіді на найпоширеніші запитання про платформу Біржа Каналів.</p>
                    </header>

                    <div className="faq-page-list">
                        {faqItems.map((item) => (
                            <details key={item.q} className="faq-page-item">
                                <summary>{item.q}</summary>
                                <p>{item.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
