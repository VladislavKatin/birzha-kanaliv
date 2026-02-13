# Етап 5: Публічні сторінки (React Components)

## 🎯 Мета
Створити публічні сторінки, адаптуючи дизайн із існуючого проекту.

---

## 5.1 Layout Components

### client/src/components/layout/Navbar.jsx
```javascript
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="url(#logoGradient)" strokeWidth="2" />
              <path d="M12 10L22 16L12 22V10Z" fill="url(#logoGradient)" />
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#0057B8" />
                  <stop offset="1" stopColor="#FFD700" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span>ViewExchange</span>
          <div className="ukraine-flag" title="Україна">
            <span className="flag-blue"></span>
            <span className="flag-yellow"></span>
          </div>
        </Link>

        <div className="nav-links">
          <a href="#how-it-works">Як це працює</a>
          <a href="#features">Можливості</a>
          <a href="#use-cases">Для кого</a>
          <Link to="/pricing">Ціни</Link>
        </div>

        <div className="nav-actions">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Кабінет</Link>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost">Увійти</Link>
              <Link to="/auth" className="btn-primary">Почати безкоштовно</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

### client/src/components/layout/Footer.jsx
```javascript
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">
              {/* Logo SVG */}
              <span>ViewExchange</span>
            </Link>
            <p>Маркетплейс рекламного трафіку та партнерств для YouTube-креаторів.</p>
            <div className="social-links">
              <a href="#" aria-label="Twitter">𝕏</a>
              <a href="#" aria-label="YouTube">▶</a>
              <a href="#" aria-label="Telegram">✈</a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Продукт</h4>
            <ul>
              <li><a href="#features">Можливості</a></li>
              <li><Link to="/pricing">Ціни</Link></li>
              <li><Link to="/marketplace">Маркетплейс</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Компанія</h4>
            <ul>
              <li><Link to="/about">Про нас</Link></li>
              <li><Link to="/blog">Блог</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Юридична інформація</h4>
            <ul>
              <li><Link to="/privacy">Конфіденційність</Link></li>
              <li><Link to="/terms">Умови</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 ViewExchange. Усі права захищені.</p>
          <p>Створено з ♥ для креаторів України та світу.</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## 5.2 Home Page (Landing)

### client/src/pages/public/Home.jsx
```javascript
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import HeroSection from '../../components/home/HeroSection';
import HowItWorks from '../../components/home/HowItWorks';
import TrustSection from '../../components/home/TrustSection';
import FeaturesSection from '../../components/home/FeaturesSection';
import UseCasesSection from '../../components/home/UseCasesSection';
import PricingSection from '../../components/home/PricingSection';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import FinalCTA from '../../components/home/FinalCTA';
import '../../styles/home.css';

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <TrustSection />
      <FeaturesSection />
      <UseCasesSection />
      <PricingSection />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
```

### client/src/components/home/HeroSection.jsx
```javascript
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-gradient"></div>
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="container hero-content">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span>50,000+ креаторів • Тільки реальні люди • Без ботів</span>
        </div>

        <h1 className="hero-title">
          Платформа для покупки та<br />
          <span className="gradient-text">обміну YouTube-аудиторією</span>
        </h1>

        <p className="hero-subtitle">
          Знайди креаторів для взаємного просування або запусти рекламу свого каналу. 
          Без ботів та накрутки — тільки реальні рекламні розміщення.
        </p>

        <div className="hero-cta">
          <Link to="/marketplace" className="btn-primary btn-large">
            <span>Знайти канали для просування</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link to="/auth" className="btn-secondary btn-large">
            <span>Розмістити свій канал</span>
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value">50K+</span>
            <span className="stat-label">Креаторів</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-value">10K+</span>
            <span className="stat-label">Успішних партнерств</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-value">100%</span>
            <span className="stat-label">Живий трафік</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 5.3 About Page

### client/src/pages/public/About.jsx
```javascript
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/about.css';

export default function About() {
  return (
    <div className="about-page">
      <Navbar />
      
      <section className="about-hero">
        <div className="container">
          <h1>Про <span className="gradient-text">ViewExchange</span></h1>
          <p>Українська платформа для креаторів, які хочуть зростати разом</p>
        </div>
      </section>

      <section className="about-content">
        <div className="container">
          <div className="about-story">
            <h2>Наша історія</h2>
            <p>
              ViewExchange створено в Україні командою, яка розуміє виклики молодих креаторів. 
              Ми знаємо, як важко пробитися на YouTube без накрутки та ботів.
            </p>
            <p>
              Наша місія — допомогти креаторам знаходити партнерів для взаємного просування,
              обмінюватися аудиторією та зростати органічно.
            </p>
          </div>

          <div className="about-values">
            <h2>Наші цінності</h2>
            <div className="values-grid">
              <div className="value-card">
                <span className="value-icon">🛡️</span>
                <h3>Без ботів</h3>
                <p>Тільки реальні креатори та живий трафік</p>
              </div>
              <div className="value-card">
                <span className="value-icon">🤝</span>
                <h3>Партнерство</h3>
                <p>Зростаємо разом, підтримуючи один одного</p>
              </div>
              <div className="value-card">
                <span className="value-icon">🇺🇦</span>
                <h3>Україна</h3>
                <p>Створено в Україні для креаторів світу</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

---

## 5.4 FAQ Page

### client/src/pages/public/FAQ.jsx
```javascript
import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/faq.css';

const faqData = [
  {
    question: 'Що таке ViewExchange?',
    answer: 'ViewExchange — це маркетплейс рекламного трафіку та партнерств для YouTube-креаторів. Ми з\'єднуємо креаторів для взаємного просування та покупки/продажу рекламних розміщень.'
  },
  {
    question: 'Чи безпечно це для мого каналу?',
    answer: 'Так, абсолютно! Ми використовуємо лише офіційні рекламні розміщення та партнерства. Жодних ботів, накрутки чи порушень правил YouTube.'
  },
  {
    question: 'Скільки це коштує?',
    answer: 'Базовий план безкоштовний назавжди. Ви можете проводити до 10 обмінів на місяць. Pro та Agency плани надають необмежений доступ.'
  },
  {
    question: 'Як працює обмін аудиторією?',
    answer: 'Ви знаходите партнера у схожій ніші, домовляєтесь про формат (згадка у відео, посилання в описі тощо), і обидва отримуєте новий трафік від аудиторії партнера.'
  },
  {
    question: 'Чи можу я купити рекламу?',
    answer: 'Так! Багато креаторів продають рекламні розміщення на своїх каналах. Ви можете напряму домовитись про ціну та формат.'
  }
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="faq-page">
      <Navbar />

      <section className="faq-hero">
        <div className="container">
          <h1>Часті питання</h1>
          <p>Відповіді на найпоширеніші запитання про ViewExchange</p>
        </div>
      </section>

      <section className="faq-content">
        <div className="container">
          <div className="faq-list">
            {faqData.map((item, index) => (
              <FAQItem key={index} {...item} />
            ))}
          </div>

          <div className="faq-contact">
            <h2>Не знайшли відповідь?</h2>
            <p>Напишіть нам і ми допоможемо!</p>
            <a href="mailto:support@viewexchange.ua" className="btn-primary">
              Звʼязатися з підтримкою
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

---

## 5.5 Pricing Page

### client/src/pages/public/Pricing.jsx
```javascript
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/pricing.css';

const plans = [
  {
    name: 'Безкоштовно',
    price: '₴0',
    period: '/назавжди',
    description: 'Ідеально для початку',
    features: [
      'До 10 запитів на співпрацю/місяць',
      'Базова аналітика',
      'Доступ до спільноти',
      'Email підтримка'
    ],
    cta: 'Почати безкоштовно',
    featured: false
  },
  {
    name: 'Pro',
    price: '₴499',
    period: '/місяць',
    description: 'Для серйозних креаторів',
    features: [
      'Необмежені запити',
      'Розширена аналітика',
      'Фільтрування по ніші',
      'Пріоритетна підтримка',
      'Верифікований бейдж'
    ],
    cta: 'Спробувати 14 днів',
    featured: true
  },
  {
    name: 'Агенція',
    price: '₴2499',
    period: '/місяць',
    description: 'Для команд та мереж',
    features: [
      'Все з Pro',
      'До 10 каналів',
      'Командна панель',
      'API доступ',
      'Персональний менеджер'
    ],
    cta: 'Звʼязатися з відділом продажів',
    featured: false
  }
];

export default function Pricing() {
  return (
    <div className="pricing-page">
      <Navbar />

      <section className="pricing-hero">
        <div className="container">
          <span className="section-badge">Ціни</span>
          <h1>Почни безкоштовно. <span className="gradient-text">Оновлюйся коли готовий.</span></h1>
          <p>Без кредитної картки. Без прихованих платежів. Назавжди.</p>
        </div>
      </section>

      <section className="pricing-grid-section">
        <div className="container">
          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                {plan.featured && <div className="pricing-badge">Найпопулярніший</div>}
                <h3>{plan.name}</h3>
                <p className="price">
                  <span className="amount">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </p>
                <p className="price-desc">{plan.description}</p>
                <ul>
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <span className="check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link 
                  to={plan.name === 'Агенція' ? 'mailto:sales@viewexchange.ua' : '/auth'} 
                  className={plan.featured ? 'btn-primary btn-block' : 'btn-secondary btn-block'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

---

## 5.6 Blog Pages

### client/src/pages/public/Blog.jsx
```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import '../../styles/blog.css';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await api.get('/blog');
        setPosts(response.data.posts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <div className="blog-page">
      <Navbar />

      <section className="blog-hero">
        <div className="container">
          <h1>Блог ViewExchange</h1>
          <p>Поради, інсайти та історії успіху для YouTube-креаторів</p>
        </div>
      </section>

      <section className="blog-content">
        <div className="container">
          {loading ? (
            <div className="loading">Завантаження...</div>
          ) : (
            <div className="blog-grid">
              {posts.map(post => (
                <article key={post.id} className="blog-card">
                  {post.coverImage && (
                    <img src={post.coverImage} alt={post.title} className="blog-cover" />
                  )}
                  <div className="blog-card-content">
                    <span className="blog-category">{post.category}</span>
                    <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                    <p>{post.excerpt}</p>
                    <div className="blog-meta">
                      <span>{post.readTime} хв читання</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

---

## ✅ Чеклист етапу

- [ ] Створено Navbar компонент
- [ ] Створено Footer компонент
- [ ] Створено Home page з усіма секціями
- [ ] Створено About page
- [ ] Створено FAQ page з акордеоном
- [ ] Створено Pricing page
- [ ] Створено Blog listing page
- [ ] Створено Blog post page
- [ ] Адаптовано та підключено CSS стилі
- [ ] Протестовано responsive дизайн
