import Navbar from './Navbar';
import Footer from './Footer';
import './PublicLayout.css';

export default function PublicLayout({ children }) {
    return (
        <div className="public-layout">
            <Navbar />
            <main className="public-main">{children}</main>
            <Footer />
        </div>
    );
}
