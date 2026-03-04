import { useEffect, useMemo, useRef, useState } from 'react';
import HomePage from './pages/HomePage';
import MandiPage from './pages/MandiPage';
import SchemesPage from './pages/SchemesPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import { clearSession, getStoredUser } from './auth';
import { emitToast } from './toast';

const PATH_TO_TAB = {
  '/': 'home',
  '/home': 'home',
  '/mandi': 'mandi',
  '/schemes': 'schemes',
  '/auth': 'auth',
  '/admin': 'admin',
  '/farmer': 'farmer',
  '/buyer': 'buyer',
};

const TAB_TO_PATH = {
  home: '/',
  mandi: '/mandi',
  schemes: '/schemes',
  auth: '/auth',
  admin: '/admin',
  farmer: '/farmer',
  buyer: '/buyer',
};

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'mandi', label: 'Mandi Prices' },
  { key: 'schemes', label: 'Schemes' },
  { key: 'admin', label: 'Admin' },
  { key: 'farmer', label: 'Farmer Dashboard' },
  { key: 'buyer', label: 'Buyer Dashboard' },
];

function AccessDenied({ role, onGoAuth }) {
  return (
    <section>
      <div className="card access-card">
        <h2>Access Restricted</h2>
        <p>This section requires a logged-in {role} account.</p>
        <button onClick={onGoAuth}>Go to Auth</button>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    return PATH_TO_TAB[path] || 'home';
  });
  const [sessionUser, setSessionUser] = useState(getStoredUser());
  const [authNotice, setAuthNotice] = useState('');
  const [globalToast, setGlobalToast] = useState({ message: '', type: 'info' });
  const [authMode, setAuthMode] = useState('landing');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const role = sessionUser?.role;

  const allowedTabs = useMemo(() => {
    const role = sessionUser?.role;
    const defaultTabs = ['home', 'mandi', 'schemes', 'auth'];

    if (role === 'farmer') return [...defaultTabs, 'farmer'];
    if (role === 'buyer') return [...defaultTabs, 'buyer'];
    if (role === 'admin') return [...defaultTabs, 'admin'];
    return defaultTabs;
  }, [sessionUser]);

  const visibleTabs = useMemo(() => tabs.filter((tab) => allowedTabs.includes(tab.key)), [allowedTabs]);

  const updateUrlForTab = (tab, replace = false) => {
    const path = TAB_TO_PATH[tab] || '/';
    if (window.location.pathname === path) return;

    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
  };

  const safeNavigate = (targetTab) => {
    if (allowedTabs.includes(targetTab)) {
      setActiveTab(targetTab);
      if (targetTab === 'auth') setAuthMode('landing');
      updateUrlForTab(targetTab);
      return;
    }

    const message = 'Please login with the correct role to access that section.';
    setAuthNotice(message);
    emitToast(message, 'warning');
    setAuthMode('landing');
    setActiveTab('auth');
    updateUrlForTab('auth');
  };

  const openAuthFromDropdown = (mode) => {
    setAuthMode(mode);
    setActiveTab('auth');
    updateUrlForTab('auth');
    setAccountMenuOpen(false);
  };

  const handleHeaderLogout = () => {
    clearSession();
    setSessionUser(null);
    setAuthMode('login');
    setActiveTab('auth');
    updateUrlForTab('auth');
    setAccountMenuOpen(false);
    emitToast('Logged out successfully.', 'success');
  };

  const goToRoleDashboard = () => {
    if (!sessionUser?.role) {
      openAuthFromDropdown('login');
      return;
    }

    safeNavigate(sessionUser.role);
    setAccountMenuOpen(false);
  };

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('auth');
      updateUrlForTab('auth', true);
    }
  }, [activeTab, allowedTabs]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const targetTab = PATH_TO_TAB[path] || 'home';
      if (allowedTabs.includes(targetTab)) {
        setActiveTab(targetTab);
      } else {
        const message = 'Please login with the correct role to access that section.';
        setAuthNotice(message);
        emitToast(message, 'warning');
        setActiveTab('auth');
        updateUrlForTab('auth', true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [allowedTabs]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionUser(null);
      const message = 'Session expired. Please login again.';
      setAuthNotice(message);
      emitToast(message, 'warning');
      setActiveTab('auth');
      updateUrlForTab('auth');
    };

    const handleToast = (event) => {
      const payload = event.detail || {};
      if (!payload.message) return;
      setGlobalToast({ message: payload.message, type: payload.type || 'info' });
    };

    window.addEventListener('agrimandi-session-expired', handleSessionExpired);
    window.addEventListener('agrimandi-toast', handleToast);
    return () => {
      window.removeEventListener('agrimandi-session-expired', handleSessionExpired);
      window.removeEventListener('agrimandi-toast', handleToast);
    };
  }, []);

  useEffect(() => {
    if (!globalToast.message) return;

    const timer = setTimeout(() => {
      setGlobalToast({ message: '', type: 'info' });
    }, 3200);

    return () => clearTimeout(timer);
  }, [globalToast]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <h1>Krishi Mitra</h1>
            <p>Dynamic crop marketplace with real-time updates</p>
          </div>

          <div className="account-menu" ref={accountMenuRef}>
            <button className="btn-ghost" onClick={() => setAccountMenuOpen((prev) => !prev)}>
              Account ▾
            </button>
            {accountMenuOpen ? (
              <div className="account-dropdown">
                {sessionUser ? <p className="account-role">Signed in as {sessionUser.role}</p> : null}

                {sessionUser ? (
                  <>
                    <button onClick={goToRoleDashboard}>Go to Dashboard</button>
                    <button className="btn-danger" onClick={handleHeaderLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openAuthFromDropdown('login')}>Login</button>
                    <button className="btn-ghost" onClick={() => openAuthFromDropdown('register')}>
                      Register
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {globalToast.message ? <div className={`global-toast global-toast-${globalToast.type}`}>{globalToast.message}</div> : null}

      <nav className="tab-nav" aria-label="Dashboard Tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'tab active' : 'tab'}
            onClick={() => safeNavigate(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'home' ? <HomePage onNavigate={safeNavigate} /> : null}
        {activeTab === 'mandi' ? <MandiPage /> : null}
        {activeTab === 'schemes' ? <SchemesPage /> : null}
        {activeTab === 'auth' ? <AuthPage onRoleNavigate={safeNavigate} onSessionChange={setSessionUser} notice={authNotice} onNoticeClear={() => setAuthNotice('')} initialMode={authMode} /> : null}
        {activeTab === 'admin' ? (role === 'admin' ? <AdminPage /> : <AccessDenied role="admin" onGoAuth={() => setActiveTab('auth')} />) : null}
        {activeTab === 'farmer' ? (role === 'farmer' ? <FarmerDashboard /> : <AccessDenied role="farmer" onGoAuth={() => setActiveTab('auth')} />) : null}
        {activeTab === 'buyer' ? (role === 'buyer' ? <BuyerDashboard /> : <AccessDenied role="buyer" onGoAuth={() => setActiveTab('auth')} />) : null}
      </main>
    </div>
  );
}
