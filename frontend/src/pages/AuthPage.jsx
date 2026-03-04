import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { clearSession, getStoredUser, setSession } from '../auth';
import { emitToast } from '../toast';

const registerInitial = {
  name: '',
  email: '',
  password: '',
  role: 'farmer',
};

const loginInitial = {
  email: '',
  password: '',
};

export default function AuthPage({ onRoleNavigate, onSessionChange, notice, onNoticeClear, initialMode = 'landing' }) {
  const [mode, setMode] = useState(initialMode);
  const [registerForm, setRegisterForm] = useState(registerInitial);
  const [loginForm, setLoginForm] = useState(loginInitial);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(getStoredUser());

  const roleLabel = useMemo(() => (sessionUser ? `Logged in as ${sessionUser.role}` : 'Not logged in'), [sessionUser]);

  useEffect(() => {
    setMode(initialMode || 'landing');
  }, [initialMode]);

  const navigateByRole = (role) => {
    if (!onRoleNavigate) return;

    if (role === 'farmer') onRoleNavigate('farmer');
    if (role === 'buyer') onRoleNavigate('buyer');
    if (role === 'admin') onRoleNavigate('admin');
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', registerForm);
      setSession(data);
      setSessionUser(data.user);
      if (onSessionChange) onSessionChange(data.user);
      if (onNoticeClear) onNoticeClear();
      setMessage('Registration successful. Please login.');
      emitToast('Registration successful. Please login.', 'success');
      setError('');
      setRegisterForm(registerInitial);
      setMode('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', loginForm);
      setSession(data);
      setSessionUser(data.user);
      if (onSessionChange) onSessionChange(data.user);
      if (onNoticeClear) onNoticeClear();
      setMessage('Login successful.');
      emitToast('Login successful.', 'success');
      setError('');
      setLoginForm(loginInitial);
      navigateByRole(data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSessionUser(null);
    if (onSessionChange) onSessionChange(null);
    if (onNoticeClear) onNoticeClear();
    setMessage('Logged out.');
    emitToast('Logged out successfully.', 'success');
    setError('');
  };

  return (
    <section className="auth-shell">
      <div className="card auth-card">
        <h2>Authentication</h2>
        <p className="session-label">{roleLabel}</p>
        {notice ? <p className="notice-text">{notice}</p> : null}
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {mode === 'landing' ? (
          <div className="auth-actions">
            <button onClick={() => setMode('login')}>Login</button>
            <button className="btn-ghost" onClick={() => setMode('register')}>
              Register
            </button>
            {sessionUser ? (
              <button className="btn-danger" onClick={handleLogout}>
                Logout
              </button>
            ) : null}
          </div>
        ) : null}

        {mode === 'register' ? (
          <form className="form-grid" onSubmit={handleRegister}>
            <input
              placeholder="Name"
              value={registerForm.name}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <select
              value={registerForm.role}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="farmer">farmer</option>
              <option value="buyer">buyer</option>
              <option value="admin">admin</option>
            </select>
            <div className="auth-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Register'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setMode('landing')}>
                Back
              </button>
            </div>
          </form>
        ) : null}

        {mode === 'login' ? (
          <form className="form-grid" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <div className="auth-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Login'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setMode('landing')}>
                Back
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
