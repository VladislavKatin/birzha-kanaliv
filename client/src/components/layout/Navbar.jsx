import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import './PublicLayout.css';

export default function Navbar() {
    const navigate = useNavigate();
    const user = auth.currentUser;

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <span className="navbar-logo-icon">▶</span>
                    <span className="navbar-logo-text">Біржа Каналів</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/offers" className="navbar-link">Пропозиції</Link>
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
