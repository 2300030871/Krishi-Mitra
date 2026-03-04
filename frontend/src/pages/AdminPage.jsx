import { useEffect, useState } from 'react';
import api from '../api';
import { getToken, getStoredUser } from '../auth';
import { emitToast } from '../toast';

const sidebarItems = [
  { key: 'news', label: 'Add News' },
  { key: 'schemes', label: 'Manage Schemes' },
  { key: 'users', label: 'Manage Users' },
];

export default function AdminPage() {
  const [activePanel, setActivePanel] = useState('news');
  const [news, setNews] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(8);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [newsForm, setNewsForm] = useState({ title: '', content: '', image: '' });
  const [schemeForm, setSchemeForm] = useState({ title: '', description: '', eligibility: '', link: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sessionUser = getStoredUser();
  const token = getToken();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = async () => {
    try {
      const queryRole = roleFilter === 'all' ? '' : roleFilter;
      const [{ data: newsData }, { data: schemesData }, { data: usersData }] = await Promise.all([
        api.get('/news'),
        api.get('/schemes'),
        api.get('/admin/users', {
          headers,
          params: {
            role: queryRole || undefined,
            search: userSearch || undefined,
            page: userPage,
            limit: userLimit,
          },
        }),
      ]);
      setNews(Array.isArray(newsData) ? newsData : []);
      setSchemes(Array.isArray(schemesData) ? schemesData : []);

      if (Array.isArray(usersData)) {
        setUsers(usersData);
        setUserTotal(usersData.length);
        setUserTotalPages(1);
      } else {
        setUsers(Array.isArray(usersData?.items) ? usersData.items : []);
        setUserTotal(Number(usersData?.total || 0));
        setUserTotalPages(Number(usersData?.totalPages || 1));
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch admin content.');
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, userSearch, userPage]);

  const addNews = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin/news', newsForm, { headers });
      setNewsForm({ title: '', content: '', image: '' });
      setMessage('News added.');
      emitToast('News added successfully.', 'success');
      setError('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add news.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const deleteNews = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/admin/news/${id}`, { headers });
      setMessage('News deleted.');
      emitToast('News deleted successfully.', 'success');
      setError('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete news.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const addScheme = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin/schemes', schemeForm, { headers });
      setSchemeForm({ title: '', description: '', eligibility: '', link: '' });
      setMessage('Scheme added.');
      emitToast('Scheme added successfully.', 'success');
      setError('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add scheme.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const deleteScheme = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/admin/schemes/${id}`, { headers });
      setMessage('Scheme deleted.');
      emitToast('Scheme deleted successfully.', 'success');
      setError('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete scheme.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const deactivateUser = async (id) => {
    setLoading(true);
    try {
      await api.patch(`/admin/users/${id}/deactivate`, {}, { headers });
      setMessage('User deactivated.');
      emitToast('User deactivated successfully.', 'success');
      setError('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/admin/users/${id}`, { headers });
      setMessage('User deleted.');
      emitToast('User deleted successfully.', 'success');
      setError('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = sessionUser?.role === 'admin';
  const renderNewsPanel = () => (
    <div className="admin-section-grid">
      <form className="card form-grid" onSubmit={addNews}>
        <h3>Add News</h3>
        <input
          placeholder="News title"
          value={newsForm.title}
          onChange={(event) => setNewsForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <input
          placeholder="News content"
          value={newsForm.content}
          onChange={(event) => setNewsForm((prev) => ({ ...prev, content: event.target.value }))}
          required
        />
        <input
          placeholder="Image URL (optional)"
          value={newsForm.image}
          onChange={(event) => setNewsForm((prev) => ({ ...prev, image: event.target.value }))}
        />
        <button type="submit" disabled={!isAdmin || loading}>
          Add News
        </button>
      </form>

      <div className="card">
        <h3>News Items</h3>
        {news.length === 0 ? (
          <p className="empty-cell">No news items found.</p>
        ) : (
          news.map((item) => (
            <div key={item._id} className="admin-item">
              <div>
                <strong>{item.title}</strong>
                <p>{item.content}</p>
              </div>
              <button className="btn-small btn-danger" disabled={!isAdmin || loading} onClick={() => deleteNews(item._id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSchemePanel = () => (
    <div className="admin-section-grid">
      <form className="card form-grid" onSubmit={addScheme}>
        <h3>Add Scheme</h3>
        <input
          placeholder="Scheme title"
          value={schemeForm.title}
          onChange={(event) => setSchemeForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <input
          placeholder="Scheme description"
          value={schemeForm.description}
          onChange={(event) => setSchemeForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
        <input
          placeholder="Eligibility"
          value={schemeForm.eligibility}
          onChange={(event) => setSchemeForm((prev) => ({ ...prev, eligibility: event.target.value }))}
          required
        />
        <input
          placeholder="Official Link (optional)"
          value={schemeForm.link}
          onChange={(event) => setSchemeForm((prev) => ({ ...prev, link: event.target.value }))}
        />
        <button type="submit" disabled={!isAdmin || loading}>
          Add Scheme
        </button>
      </form>

      <div className="card">
        <h3>Schemes</h3>
        {schemes.length === 0 ? (
          <p className="empty-cell">No schemes found.</p>
        ) : (
          schemes.map((item) => (
            <div key={item._id} className="admin-item">
              <div>
                <strong>{item.title || item.name}</strong>
                <p>{item.description || item.details}</p>
                <p>
                  <strong>Eligibility:</strong> {item.eligibility || 'Not specified'}
                </p>
              </div>
              <button className="btn-small btn-danger" disabled={!isAdmin || loading} onClick={() => deleteScheme(item._id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderUsersPanel = () => (
    <div className="card">
      <div className="admin-users-head">
        <h3>Users</h3>
        <div className="admin-users-filters">
          <input
            placeholder="Search by name or email"
            value={userSearch}
            onChange={(event) => {
              setUserPage(1);
              setUserSearch(event.target.value);
            }}
          />
          <select
            value={roleFilter}
            onChange={(event) => {
              setUserPage(1);
              setRoleFilter(event.target.value);
            }}
          >
            <option value="all">All Roles</option>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="empty-cell">No users found for selected role.</p>
      ) : (
        users.map((user) => (
          <div key={user._id} className="admin-item">
            <div>
              <strong>
                {user.name} ({user.role})
              </strong>
              <p>{user.email}</p>
              <p>
                <strong>Status:</strong> {user.isActive ? 'Active' : 'Deactivated'}
              </p>
              <p>
                <strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="button-row">
              <button className="btn-small btn-ghost" disabled={!isAdmin || loading || !user.isActive} onClick={() => deactivateUser(user._id)}>
                Deactivate
              </button>
              <button className="btn-small btn-danger" disabled={!isAdmin || loading} onClick={() => removeUser(user._id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      <div className="admin-users-footer">
        <small>
          Showing {users.length} of {userTotal} users
        </small>
        <div className="button-row">
          <button
            type="button"
            className="btn-small btn-ghost"
            disabled={loading || userPage <= 1}
            onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </button>
          <span className="session-label">
            Page {userPage} / {userTotalPages}
          </span>
          <button
            type="button"
            className="btn-small btn-ghost"
            disabled={loading || userPage >= userTotalPages}
            onClick={() => setUserPage((prev) => Math.min(userTotalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="admin-shell">
      <aside className="card admin-sidebar">
        <h2>Admin Dashboard</h2>
        <div className="admin-sidebar-items">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={activePanel === item.key ? 'admin-side-btn active' : 'admin-side-btn'}
              onClick={() => setActivePanel(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="admin-main">
      <h2>Admin Content Management</h2>
      <p className="session-label">{isAdmin ? 'Admin session detected' : 'Login as admin to manage content'}</p>
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {activePanel === 'news' ? renderNewsPanel() : null}
      {activePanel === 'schemes' ? renderSchemePanel() : null}
      {activePanel === 'users' ? renderUsersPanel() : null}
      </div>
    </section>
  );
}
