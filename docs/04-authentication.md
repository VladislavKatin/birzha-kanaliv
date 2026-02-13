# Етап 4: Firebase Authentication + React Context

## 🎯 Мета
Інтегрувати Firebase Authentication в React додаток з Context API.

---

## 4.1 Firebase конфігурація

### client/src/services/firebase.js
```javascript
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
};
```

---

## 4.2 Auth Context

### client/src/context/AuthContext.jsx
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync with backend after Firebase auth
  async function syncWithBackend(firebaseUser) {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await api.post('/auth/register', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDbUser(response.data.user);
      return response.data.user;
    } catch (err) {
      console.error('Backend sync failed:', err);
      throw err;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          await syncWithBackend(firebaseUser);
        } catch (err) {
          console.error('Sync error:', err);
        }
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  async function signInWithGoogle() {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncWithBackend(result.user);
      return result.user;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }

  // Sign in with email/password
  async function signIn(email, password) {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncWithBackend(result.user);
      return result.user;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }

  // Sign up with email/password
  async function signUp(email, password, displayName) {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      await syncWithBackend(result.user);
      return result.user;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }

  // Reset password
  async function resetPassword(email) {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }

  // Sign out
  async function signOut() {
    try {
      await firebaseSignOut(auth);
      setDbUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  }

  // Get current user's token
  async function getToken() {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  // Ukrainian error messages
  function getErrorMessage(code) {
    const messages = {
      'auth/email-already-in-use': 'Цей email вже зареєстрований',
      'auth/invalid-email': 'Невірний формат email',
      'auth/weak-password': 'Пароль занадто простий',
      'auth/user-not-found': 'Користувача не знайдено',
      'auth/wrong-password': 'Невірний пароль',
      'auth/popup-closed-by-user': 'Вікно авторизації закрито',
      'auth/network-request-failed': 'Помилка мережі',
      'auth/too-many-requests': 'Забагато спроб. Спробуйте пізніше',
      'auth/invalid-credential': 'Невірні дані для входу'
    };
    return messages[code] || 'Сталася помилка. Спробуйте ще раз.';
  }

  const value = {
    user,           // Firebase user
    dbUser,         // Backend user with full profile
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    signOut,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 4.3 API Service з Auth Token

### client/src/services/api.js
```javascript
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4.4 Protected Route Component

### client/src/components/auth/ProtectedRoute.jsx
```javascript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Завантаження...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
```

---

## 4.5 Auth Page Component

### client/src/pages/auth/Auth.jsx
```javascript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: '', type: '' });

    try {
      if (isResetPassword) {
        await resetPassword(email);
        setStatus({ message: 'Посилання для відновлення надіслано!', type: 'success' });
        setIsResetPassword(false);
      } else if (isSignUp) {
        if (password !== confirmPassword) {
          setStatus({ message: 'Паролі не співпадають!', type: 'error' });
          setIsLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        navigate(from, { replace: true });
      } else {
        await signIn(email, password);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setStatus({ message: error || 'Помилка авторизації', type: 'error' });
    }

    setIsLoading(false);
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setStatus({ message: error || 'Помилка входу через Google', type: 'error' });
    }
    setIsLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-bg">
        <div className="bg-gradient"></div>
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      <a href="/" className="auth-logo">
        {/* Logo SVG */}
        <span>ViewExchange</span>
      </a>

      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {isResetPassword 
              ? 'Відновлення паролю'
              : isSignUp 
                ? 'Створи акаунт безкоштовно'
                : 'Увійди, щоб зростити свій канал'
            }
          </h1>
          <p>Довірена платформа для креаторів</p>
        </div>

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}

        <div className="social-buttons">
          <button 
            className="social-btn google"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {/* Google icon */}
            <span>Продовжити з Google</span>
          </button>
        </div>

        <div className="divider"><span>або</span></div>

        <form className="email-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          {!isResetPassword && (
            <div className="input-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {isSignUp && (
            <>
              <div className="input-group">
                <label htmlFor="confirmPassword">Підтвердіть пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="displayName">Ваше імʼя</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Іван Петренко"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            <span>
              {isLoading 
                ? 'Зачекайте...'
                : isResetPassword 
                  ? 'Надіслати посилання'
                  : isSignUp 
                    ? 'Зареєструватися'
                    : 'Увійти'
              }
            </span>
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isSignUp ? 'Вже є акаунт?' : 'Немає акаунту?'}</span>
          <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Увійти' : 'Зареєструватися'}
          </button>
        </div>

        {!isSignUp && !isResetPassword && (
          <div className="forgot-password">
            <button type="button" onClick={() => setIsResetPassword(true)}>
              Забули пароль?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4.6 App Entry with Auth Provider

### client/src/App.jsx
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Auth from './pages/auth/Auth';

// Protected pages
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/dashboard/Profile';
import Marketplace from './pages/dashboard/Marketplace';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/marketplace" element={
            <ProtectedRoute><Marketplace /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## ✅ Чеклист етапу

- [ ] Налаштовано Firebase SDK в React
- [ ] Створено AuthContext з усіма методами авторизації
- [ ] Реалізовано signIn, signUp, signInWithGoogle, resetPassword, signOut
- [ ] Створено API service з автоматичним додаванням токену
- [ ] Реалізовано ProtectedRoute компонент
- [ ] Створено сторінку авторизації (Auth.jsx)
- [ ] Інтегровано AuthProvider в App.jsx
- [ ] Протестовано всі методи авторизації
