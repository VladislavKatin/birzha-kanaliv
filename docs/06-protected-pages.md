# Етап 6: Захищені сторінки (Dashboard, Profile, Settings тощо)

## 🎯 Мета
Створити всі захищені сторінки, доступні тільки авторизованим користувачам.

---

## 6.1 Dashboard Layout

### client/src/components/layout/DashboardLayout.jsx
```javascript
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Дашборд' },
  { path: '/marketplace', icon: 'search', label: 'Маркетплейс' },
  { path: '/exchanges', icon: 'exchange', label: 'Обміни' },
  { path: '/my-channels', icon: 'channel', label: 'Мої канали' },
  { path: '/analytics', icon: 'analytics', label: 'Аналітика' },
  { path: '/messages', icon: 'messages', label: 'Повідомлення' },
  { path: '/notifications', icon: 'bell', label: 'Сповіщення' },
  { path: '/settings', icon: 'settings', label: 'Налаштування' }
];

export default function DashboardLayout({ children }) {
  const { user, dbUser, signOut } = useAuth();
  const location = useLocation();

  const displayName = dbUser?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Користувач';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">
            {/* Logo SVG */}
            <span>ViewExchange</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className={`nav-icon icon-${item.icon}`}></span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={signOut} className="logout-btn">
            Вийти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <h1 data-user-welcome>Вітаємо, {displayName}! 👋</h1>
          </div>
          <div className="header-right">
            <Link to="/notifications" className="btn-icon">
              <span className="notification-dot"></span>
            </Link>
            <Link to="/profile" className="user-menu">
              <div className="user-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" />
                ) : (
                  initials
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---

## 6.2 Dashboard Page

### client/src/pages/dashboard/Dashboard.jsx
```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import '../../styles/dashboard.css';

export default function Dashboard() {
  const { dbUser } = useAuth();
  const [stats, setStats] = useState({
    exchanges: [],
    channels: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [exchangesRes, channelsRes, notificationsRes] = await Promise.all([
          api.get('/exchanges?limit=5'),
          api.get('/users/me/channels'),
          api.get('/notifications?limit=5')
        ]);

        setStats({
          exchanges: exchangesRes.data.exchanges || [],
          channels: channelsRes.data.channels || [],
          notifications: notificationsRes.data.notifications || []
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  const profileCompletion = dbUser?.profileCompleted || 0;

  return (
    <DashboardLayout>
      <div className="dashboard-grid">
        {/* Profile Completion Widget */}
        <div className="widget widget-profile">
          <div className="widget-header">
            <h3>Завершення профілю</h3>
            <span className="progress-percent">{profileCompletion}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${profileCompletion}%` }}></div>
          </div>
          <ul className="profile-checklist">
            <li className={dbUser?.displayName ? 'completed' : 'pending'}>
              <span>Базова інформація</span>
            </li>
            <li className={stats.channels.length > 0 ? 'completed' : 'pending'}>
              <span>Підключити YouTube</span>
            </li>
            <li className={dbUser?.isVerified ? 'completed' : 'pending'}>
              <span>Підтвердити email</span>
            </li>
          </ul>
          <Link to="/profile" className="btn-secondary">Заповнити профіль</Link>
        </div>

        {/* Linked Channels Widget */}
        <div className="widget widget-accounts">
          <div className="widget-header">
            <h3>Підключені акаунти</h3>
            <Link to="/settings" className="btn-add">+ Додати</Link>
          </div>
          <div className="accounts-list">
            {stats.channels.length === 0 ? (
              <div className="empty-state">
                <p>Ви ще не підключили жодного каналу</p>
                <Link to="/settings" className="btn-primary">
                  Підключити перший канал
                </Link>
              </div>
            ) : (
              stats.channels.map(channel => (
                <div key={channel.id} className="account-item">
                  <div className="account-avatar">{channel.avatar || channel.name[0]}</div>
                  <div className="account-info">
                    <span className="account-name">{channel.name}</span>
                    <span className="account-subs">{formatNumber(channel.subscribers)} підписників</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Exchanges Widget */}
        <div className="widget widget-exchanges">
          <div className="widget-header">
            <h3>Активні обміни</h3>
            <Link to="/exchanges" className="link-all">Всі →</Link>
          </div>
          <div className="exchanges-list">
            {stats.exchanges.length === 0 ? (
              <div className="empty-state">
                <p>У вас ще немає активних обмінів</p>
                <Link to="/marketplace" className="btn-secondary">
                  Знайти партнерів
                </Link>
              </div>
            ) : (
              stats.exchanges.map(exchange => (
                <div key={exchange.id} className="exchange-item">
                  <span className={`status status-${exchange.status}`}>
                    {getStatusLabel(exchange.status)}
                  </span>
                  <span className="exchange-partner">
                    {exchange.receiverChannel?.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Widget */}
        <div className="widget widget-actions">
          <div className="widget-header">
            <h3>Швидкі дії</h3>
          </div>
          <div className="actions-grid">
            <Link to="/my-channels" className="action-card">
              <div className="action-icon blue">+</div>
              <span>Додати канал</span>
            </Link>
            <Link to="/profile" className="action-card">
              <div className="action-icon violet">👤</div>
              <span>Редагувати профіль</span>
            </Link>
            <Link to="/marketplace" className="action-card">
              <div className="action-icon green">🔍</div>
              <span>Знайти креаторів</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Widget */}
        <div className="widget widget-activity">
          <div className="widget-header">
            <h3>Остання активність</h3>
            <Link to="/notifications" className="link-all">Вся історія →</Link>
          </div>
          <div className="activity-list">
            {stats.notifications.length === 0 ? (
              <div className="empty-state small">
                <p>Тут буде ваша активність</p>
                <span className="hint">Почніть з заповнення профілю!</span>
              </div>
            ) : (
              stats.notifications.map(notif => (
                <div key={notif.id} className={`activity-item ${notif.isRead ? '' : 'unread'}`}>
                  <span className="activity-title">{notif.title}</span>
                  <span className="activity-time">{formatTime(notif.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Очікує',
    accepted: 'Прийнято',
    rejected: 'Відхилено',
    completed: 'Завершено'
  };
  return labels[status] || status;
}

function formatTime(date) {
  return new Date(date).toLocaleDateString('uk-UA');
}
```

---

## 6.3 Marketplace Page

### client/src/pages/dashboard/Marketplace.jsx
```javascript
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import '../../styles/marketplace.css';

const NICHES = [
  { value: 'gaming', label: '🎮 Геймінг' },
  { value: 'tech', label: '📱 Технології' },
  { value: 'music', label: '🎵 Музика' },
  { value: 'education', label: '📚 Освіта' },
  { value: 'entertainment', label: '🎬 Розваги' },
  { value: 'lifestyle', label: '✨ Лайфстайл' },
  { value: 'sports', label: '⚽ Спорт' },
  { value: 'cooking', label: '🍳 Кулінарія' }
];

export default function Marketplace() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    niche: [],
    country: '',
    language: '',
    contentType: 'all',
    minSubs: '',
    maxSubs: '',
    sort: 'popular'
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.niche.length > 0) params.append('niche', filters.niche.join(','));
      if (filters.country) params.append('country', filters.country);
      if (filters.language) params.append('language', filters.language);
      if (filters.contentType !== 'all') params.append('contentType', filters.contentType);
      if (filters.minSubs) params.append('minSubs', filters.minSubs);
      if (filters.maxSubs) params.append('maxSubs', filters.maxSubs);
      params.append('sort', filters.sort);
      params.append('page', pagination.page);

      const response = await api.get(`/channels?${params.toString()}`);
      setChannels(response.data.channels);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
    setLoading(false);
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleNicheToggle = (niche) => {
    setFilters(prev => ({
      ...prev,
      niche: prev.niche.includes(niche)
        ? prev.niche.filter(n => n !== niche)
        : [...prev.niche, niche]
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      niche: [],
      country: '',
      language: '',
      contentType: 'all',
      minSubs: '',
      maxSubs: '',
      sort: 'popular'
    });
  };

  const handleRequestExchange = async (channelId, channelName) => {
    if (window.confirm(`Надіслати запит на співпрацю з "${channelName}"?`)) {
      // TODO: Implement exchange request
      alert(`Запит надіслано до ${channelName}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="marketplace-layout">
        {/* Filters Sidebar */}
        <aside className="filter-panel">
          <div className="filter-header">
            <h2>Фільтри</h2>
            <button className="btn-reset" onClick={resetFilters}>Скинути</button>
          </div>

          {/* Search */}
          <div className="filter-group">
            <label>Пошук</label>
            <input
              type="text"
              placeholder="Назва каналу..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Niches */}
          <div className="filter-group">
            <label>Ніша</label>
            <div className="checkbox-list">
              {NICHES.map(niche => (
                <label key={niche.value} className="checkbox">
                  <input
                    type="checkbox"
                    checked={filters.niche.includes(niche.value)}
                    onChange={() => handleNicheToggle(niche.value)}
                  />
                  <span>{niche.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div className="filter-group">
            <label>Тип контенту</label>
            <div className="toggle-group">
              {['all', 'shorts', 'long'].map(type => (
                <button
                  key={type}
                  className={`toggle-btn ${filters.contentType === type ? 'active' : ''}`}
                  onClick={() => handleFilterChange('contentType', type)}
                >
                  {type === 'all' ? 'Все' : type === 'shorts' ? 'Shorts' : 'Довгі'}
                </button>
              ))}
            </div>
          </div>

          {/* Subscribers Range */}
          <div className="filter-group">
            <label>Підписники</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Від"
                value={filters.minSubs}
                onChange={(e) => handleFilterChange('minSubs', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="До"
                value={filters.maxSubs}
                onChange={(e) => handleFilterChange('maxSubs', e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Channels Grid */}
        <section className="channels-section">
          <div className="channels-header">
            <div className="results-info">
              <h1>Маркетплейс креаторів</h1>
              <span className="results-count">Знайдено: <strong>{pagination.total}</strong> каналів</span>
            </div>
            <div className="sort-controls">
              <label>Сортування:</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="popular">Популярні</option>
                <option value="subscribers">Підписники ↓</option>
                <option value="views">Перегляди ↓</option>
                <option value="newest">Нові</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Завантаження...</div>
          ) : (
            <div className="channels-grid">
              {channels.map(channel => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onRequestExchange={handleRequestExchange}
                />
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                ← Назад
              </button>
              <span>Сторінка {pagination.page} з {pagination.pages}</span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Далі →
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function ChannelCard({ channel, onRequestExchange }) {
  return (
    <div className="channel-card">
      <div className="channel-header">
        <div className="channel-avatar">
          {channel.avatar || channel.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="channel-info">
          <h3 className="channel-name">{channel.name}</h3>
          <div className="channel-meta">
            <span className="country-flag">{channel.country === 'ua' ? '🇺🇦' : '🌍'}</span>
            <span className={`content-type ${channel.contentType}`}>
              {channel.contentType === 'shorts' ? 'Shorts' : 'Довгі'}
            </span>
          </div>
        </div>
      </div>

      <div className="channel-tags">
        {channel.niche?.map((n, i) => (
          <span key={i} className="niche-tag">{NICHES.find(x => x.value === n)?.label || n}</span>
        ))}
      </div>

      <div className="channel-stats">
        <div className="stat">
          <span className="stat-value">{formatNumber(channel.subscribers)}</span>
          <span className="stat-label">підписників</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatNumber(channel.avgViews)}</span>
          <span className="stat-label">сер. перегляди</span>
        </div>
      </div>

      <button
        className="btn-exchange"
        onClick={() => onRequestExchange(channel.id, channel.name)}
      >
        Запропонувати співпрацю
      </button>
    </div>
  );
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}
```

---

## 6.4 інші захищені сторінки

Аналогічно створюються:
- **Profile.jsx** — редагування профілю користувача
- **Settings.jsx** — налаштування акаунту, підключення соціальних мереж
- **Exchanges.jsx** — список обмінів та партнерств
- **MyChannels.jsx** — управління каналами
- **Analytics.jsx** — статистика та аналітика
- **Messages.jsx** — повідомлення
- **Notifications.jsx** — сповіщення
- **Channel.jsx** — сторінка окремого каналу

---

## ✅ Чеклист етапу

- [ ] Створено DashboardLayout компонент
- [ ] Реалізовано Dashboard сторінку з віджетами
- [ ] Реалізовано Marketplace з фільтрами та пагінацією
- [ ] Реалізовано Profile сторінку
- [ ] Реалізовано Settings сторінку
- [ ] Реалізовано Exchanges сторінку
- [ ] Реалізовано MyChannels сторінку
- [ ] Реалізовано Analytics сторінку
- [ ] Реалізовано Messages сторінку
- [ ] Реалізовано Notifications сторінку
- [ ] Реалізовано Channel сторінку
- [ ] Адаптовано CSS для всіх сторінок
- [ ] Протестовано функціональність
