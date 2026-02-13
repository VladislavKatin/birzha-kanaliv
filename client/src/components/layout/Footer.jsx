import { Link } from 'react-router-dom';
import { buildAuthRedirectPath } from '../../services/navigation';
import './PublicLayout.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <span className="footer-logo">▶ Біржа Каналів</span>
                    <p className="footer-desc">Безпечний обмін аудиторією між YouTube-каналами</p>
                </div>
                <div className="footer-links">
                    <Link to="/auth">Увійти</Link>
                    <Link to={buildAuthRedirectPath('/offers')}>Пропозиції</Link>
                </div>
                <div className="footer-copy">
                    © {new Date().getFullYear()} Біржа Каналів. Усі права захищені.
                </div>
            </div>
        </footer>
    );
}
