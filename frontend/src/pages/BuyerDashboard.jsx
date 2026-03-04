import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import socket from '../socket';
import BuyerFilters from '../components/BuyerFilters';
import BuyerCropList from '../components/BuyerCropList';
import ChatPanel from '../components/ChatPanel';
import { getStoredUser, setStoredUser } from '../auth';
import { updateLanguagePreference } from '../services/userService';
import { emitToast } from '../toast';

const defaultFilters = {
  crop_name: '',
  location: '',
  minPrice: '',
  maxPrice: '',
};

export default function BuyerDashboard() {
  const { t, i18n } = useTranslation();
  const sessionUser = getStoredUser();

  const toI18nCode = (language) => {
    const value = String(language || '').toLowerCase();
    if (value === 'hindi' || value === 'hi') return 'hi';
    if (value === 'telugu' || value === 'te') return 'te';
    return 'en';
  };

  const [crops, setCrops] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [language, setLanguage] = useState(sessionUser?.preferredLanguage || 'english');
  const [error, setError] = useState('');

  const fetchCrops = async (queryFilters = filters) => {
    try {
      const params = Object.fromEntries(
        Object.entries(queryFilters).filter(([, value]) => String(value).trim() !== '')
      );
      const { data } = await api.get('/allCrops', { params });
      setCrops(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load crops.');
    }
  };

  useEffect(() => {
    if (sessionUser?.preferredLanguage) {
      i18n.changeLanguage(toI18nCode(sessionUser.preferredLanguage));
    }

    fetchCrops(defaultFilters);

    const sync = () => fetchCrops();
    socket.on('cropAdded', sync);
    socket.on('cropUpdated', sync);
    socket.on('cropDeleted', sync);

    return () => {
      socket.off('cropAdded', sync);
      socket.off('cropUpdated', sync);
      socket.off('cropDeleted', sync);
    };
  }, []);

  const applyFilters = () => fetchCrops(filters);

  const resetFilters = () => {
    setFilters(defaultFilters);
    fetchCrops(defaultFilters);
  };

  const saveLanguage = async () => {
    try {
      const user = await updateLanguagePreference(language);
      await i18n.changeLanguage(toI18nCode(user.preferredLanguage));

      const existing = getStoredUser();
      if (existing) {
        setStoredUser({
          ...existing,
          preferredLanguage: user.preferredLanguage,
        });
      }

      emitToast('Language updated successfully.', 'success');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save language.');
    }
  };

  return (
    <section>
      <h2>Buyer Dashboard</h2>
      {error ? <p className="error-text">{error}</p> : null}

      <BuyerFilters filters={filters} onChange={setFilters} onApply={applyFilters} onReset={resetFilters} />
      <BuyerCropList crops={crops} />

      <div className="card buyer-lang-card">
        <h3>{t('language')}</h3>
        <div className="button-row">
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="telugu">Telugu</option>
          </select>
          <button type="button" onClick={saveLanguage}>
            {t('saveSettings')}
          </button>
        </div>
      </div>

      <div className="buyer-chat-wrap">
        <h3>Messages</h3>
        <ChatPanel title="Buyer Messages" compact />
      </div>
    </section>
  );
}
