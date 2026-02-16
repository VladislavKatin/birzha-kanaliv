import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { getLandingNavLinks } from '../../services/homeLanding';
import './PublicLayout.css';

export default function Navbar() {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const navLinks = getLandingNavLinks();

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo" aria-label="Біржа Каналів Home">
                    <span className="youtube-logo-mark" aria-hidden="true">
                        <span className="youtube-logo-play" />
                    </span>
                    <span className="navbar-logo-text">Біржа Каналів</span>
                </Link>

                <div className="navbar-links" aria-label="Landing anchors">
                    {navLinks.map((item) => (
                        <a key={item.href} href={item.href} className="navbar-link">
                            {item.label}
                        </a>
                    ))}
                    <Link to="/offers" className="navbar-link">Пропозиції</Link>
                    <Link to="/privacy-policy" className="navbar-link">Privacy Policy</Link>
                </div>

                <div className="navbar-actions">
                    {user ? (
                        <button className="navbar-btn primary" onClick={() => navigate('/dashboard')}>
                            Дашборд
                        </button>
                    ) : (
                        <button className="navbar-btn primary" onClick={() => navigate('/auth')}>
                            Увійти
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
