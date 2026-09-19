import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import StorageCard from '../components/StorageCard';
import StorageDetails from '../components/StorageDetails';
import { getColdStorageDetails, searchColdStorage } from '../services/coldStorageService';
import { isConnectivityError } from '../services/connectivityService';
import { getDraft, saveDraft } from '../services/offlineStorage';

const initialFilters = {
  produce: '',
  location: '',
  quantity: '',
  storageType: '',
};

export default function ColdStoragePage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [storageOptions, setStorageOptions] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [contactNotice, setContactNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sampleData, setSampleData] = useState(false);
  const draftLoaded = useRef(false);

  useEffect(() => {
    getDraft('cold-storage-search').then((draft) => {
      if (draft?.data) setFilters((previous) => ({ ...previous, ...draft.data }));
      draftLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (draftLoaded.current) saveDraft('cold-storage-search', filters);
  }, [filters]);

  const loadStorage = async (nextFilters = filters) => {
    setLoading(true);
    setSelectedStorage(null);
    setContactNotice('');
    try {
      const data = await searchColdStorage(nextFilters);
      setStorageOptions(data.storageOptions || []);
      setSampleData(Boolean(data.sampleData));
      saveDraft('cold-storage-results', { storageOptions: data.storageOptions || [], sampleData: Boolean(data.sampleData) });
      setError('');
    } catch (err) {
      if (isConnectivityError(err)) {
        const cached = await getDraft('cold-storage-results');
        if (cached?.data?.storageOptions) {
          setStorageOptions(cached.data.storageOptions);
          setSampleData(Boolean(cached.data.sampleData));
          setError(t('offlineCachedResults'));
        } else {
          setStorageOptions([]);
          setError(t('offlineSearchUnavailable'));
        }
      } else {
        setStorageOptions([]);
        setError(err.response?.data?.message || t('coldStorageLoadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage(initialFilters);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadStorage(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    loadStorage(initialFilters);
  };

  const loadDetails = async (storage, showContact = false) => {
    setDetailsLoading(true);
    try {
      const details = await getColdStorageDetails(storage._id);
      setSelectedStorage(details);
      setContactNotice(showContact ? t('contactDetailsShown') : '');
      setError('');
    } catch (err) {
      if (isConnectivityError(err)) {
        setSelectedStorage(storage);
        setContactNotice(t('offlineCachedDetails'));
      } else {
        setError(err.response?.data?.message || t('coldStorageDetailsError'));
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <section className="cold-storage-page">
      <div>
        <p className="session-label">{t('postHarvest')}</p>
        <h2>{t('coldStorage')}</h2>
        <p className="page-intro">{t('coldStorageIntro')}</p>
      </div>

      <form className="card storage-search-form" onSubmit={handleSubmit}>
        <div className="storage-search-grid">
          <label>
            {t('produce')}
            <input value={filters.produce} onChange={(event) => setFilters((prev) => ({ ...prev, produce: event.target.value }))} placeholder={t('producePlaceholder')} />
          </label>
          <label>
            {t('location')}
            <input value={filters.location} onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))} placeholder={t('locationPlaceholder')} />
          </label>
          <label>
            {t('quantityOptional')}
            <input type="number" min="0" step="0.01" value={filters.quantity} onChange={(event) => setFilters((prev) => ({ ...prev, quantity: event.target.value }))} placeholder={t('quantityPlaceholder')} />
          </label>
          <label>
            {t('storageType')}
            <input value={filters.storageType} onChange={(event) => setFilters((prev) => ({ ...prev, storageType: event.target.value }))} placeholder={t('storageTypePlaceholder')} />
          </label>
        </div>
        <div className="button-row">
          <button type="submit" disabled={loading}>{t('searchStorage')}</button>
          <button type="button" className="btn-ghost" onClick={handleReset} disabled={loading}>{t('reset')}</button>
        </div>
      </form>

      {sampleData ? <p className="notice-text">{t('sampleAvailabilityNotice')}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {detailsLoading ? <div className="card"><p>{t('loading')}</p></div> : null}
      <StorageDetails storage={selectedStorage} contactNotice={contactNotice} onClose={() => setSelectedStorage(null)} />

      <section>
        <h3>{t('storageOptions')}</h3>
        {loading ? <div className="card"><p>{t('loading')}</p></div> : null}
        {!loading && !storageOptions.length ? <div className="card"><p className="empty-cell">{t('noStorageOptions')}</p></div> : null}
        {!loading && storageOptions.length ? (
          <div className="storage-grid">
            {storageOptions.map((storage) => (
              <StorageCard
                key={storage._id}
                storage={storage}
                onViewDetails={() => loadDetails(storage)}
                onContact={() => loadDetails(storage, true)}
              />
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
