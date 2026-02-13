import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <section className="offer-details-page" style={{ padding: '40px 16px' }}>
            <div className="offer-details-shell" style={{ textAlign: 'center' }}>
                <h1>Сторінку не знайдено</h1>
                <p>Можливо, посилання застаріло або сторінку було переміщено.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Повернутися на головну</button>
            </div>
        </section>
    );
}
