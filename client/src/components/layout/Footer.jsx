import { Link } from 'react-router-dom';
import { buildAuthRedirectPath } from '../../services/navigation';
import { getLandingNavLinks } from '../../services/homeLanding';
import './PublicLayout.css';

export default function Footer() {
    const navLinks = getLandingNavLinks();

    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <span className="footer-logo">
                        <span className="youtube-logo-mark" aria-hidden="true">
                            <span className="youtube-logo-play" />
                        </span>
                        Біржа Каналів
                    </span>
                    <p className="footer-desc">Безпечний обмін аудиторією між YouTube-каналами</p>
                </div>
                <div className="footer-links">
                    {navLinks.map((item) => (
                        <a key={item.href} href={item.href}>{item.label}</a>
                    ))}
                    <Link to={buildAuthRedirectPath('/offers')}>Пропозиції</Link>
                    <Link to="/auth">Увійти</Link>
                </div>
                <div className="footer-copy">
                    © {new Date().getFullYear()} Біржа Каналів. Усі права захищені.
                </div>
            </div>
        </footer>
    );
}
