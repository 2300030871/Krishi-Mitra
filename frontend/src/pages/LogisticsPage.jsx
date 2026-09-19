import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LogisticsProviderCard from '../components/LogisticsProviderCard';
import LogisticsProviderDetails from '../components/LogisticsProviderDetails';
import {
  createTransportRequest,
  getMyTransportRequests,
  searchLogisticsProviders,
} from '../services/logisticsService';
import { isConnectivityError, isOnline } from '../services/connectivityService';
import { createClientRequestId, enqueueAction, getDraft, saveDraft } from '../services/offlineStorage';
import { emitToast } from '../toast';

const initialForm = {
  produce: '',
  quantity: '',
  pickupLocation: '',
  destination: '',
  vehicleType: '',
  requestedDate: '',
};

export default function LogisticsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [providers, setProviders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [requestProvider, setRequestProvider] = useState(null);
  const [requestId, setRequestId] = useState('');
  const [contactNotice, setContactNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sampleData, setSampleData] = useState(false);
  const draftLoaded = useRef(false);

  useEffect(() => {
    getDraft('logistics-form').then((draft) => {
      if (draft?.data) setForm((previous) => ({ ...previous, ...draft.data }));
      draftLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (draftLoaded.current) saveDraft('logistics-form', form);
  }, [form]);

  const loadProviders = async (nextForm = form) => {
    setLoading(true);
    try {
      const data = await searchLogisticsProviders({
        produce: nextForm.produce,
        quantity: nextForm.quantity,
        pickupLocation: nextForm.pickupLocation,
        vehicleType: nextForm.vehicleType,
      });
      setProviders(data.providers || []);
      setSampleData(Boolean(data.sampleData));
      saveDraft('logistics-provider-results', { providers: data.providers || [], sampleData: Boolean(data.sampleData) });
      setError('');
    } catch (err) {
      if (isConnectivityError(err)) {
        const cached = await getDraft('logistics-provider-results');
        if (cached?.data?.providers) {
          setProviders(cached.data.providers);
          setSampleData(Boolean(cached.data.sampleData));
          setError(t('offlineCachedResults'));
        } else {
          setProviders([]);
          setError(t('offlineSearchUnavailable'));
        }
      } else {
        setProviders([]);
        setError(err.response?.data?.message || t('logisticsLoadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setHistoryLoading(true);
    try {
      const data = await getMyTransportRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || t('logisticsHistoryError'));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([loadProviders(initialForm), loadRequests()]);
  }, []);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!form.produce || !form.quantity || !form.pickupLocation || !form.destination) {
      setError(t('logisticsRequiredFields'));
      return;
    }
    await loadProviders(form);
  };

  const handleReset = () => {
    setForm(initialForm);
    setSelectedProvider(null);
    setRequestProvider(null);
    setContactNotice('');
    setError('');
    setSuccess('');
    loadProviders(initialForm);
  };

  const handleRequest = (provider) => {
    setRequestProvider(provider);
    setRequestId(createClientRequestId());
    setSelectedProvider(provider);
    setContactNotice('');
    setSuccess('');
    setError('');
  };

  const handleContact = (provider) => {
    setSelectedProvider(provider);
    setContactNotice(t('contactDetailsShown'));
    setError('');
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!requestProvider) {
      setError(t('selectProviderFirst'));
      return;
    }

    setRequestLoading(true);
    const payload = {
      ...form,
      providerId: requestProvider._id,
      clientRequestId: requestId || createClientRequestId(),
    };

    const queueRequest = async () => {
      await enqueueAction({
        actionType: 'logistics-request',
        endpoint: '/logistics/requests',
        payload,
        requestId: payload.clientRequestId,
      });
      setSuccess(t('offlineTransportQueued'));
      emitToast(t('offlineTransportQueued'), 'warning');
      setError('');
      setRequestProvider(null);
      setRequestLoading(false);
      return;
    };

    if (!isOnline()) return queueRequest();

    try {
      await createTransportRequest(payload);
      setSuccess(t('transportRequestSubmitted'));
      setError('');
      setRequestProvider(null);
      await loadRequests();
    } catch (err) {
      if (isConnectivityError(err)) return queueRequest();
      setError(err.response?.data?.message || t('transportRequestError'));
      setSuccess('');
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    const handleSync = (event) => {
      if (event.detail?.actionType === 'logistics-request') loadRequests();
    };
    window.addEventListener('agrimandi-sync-complete', handleSync);
    return () => window.removeEventListener('agrimandi-sync-complete', handleSync);
  }, []);

  return (
    <section className="logistics-page">
      <div>
        <p className="session-label">{t('postHarvest')}</p>
        <h2>{t('logistics')}</h2>
        <p className="page-intro">{t('logisticsIntro')}</p>
      </div>

      <form className="card logistics-search-form" onSubmit={handleSearch}>
        <div className="logistics-search-grid">
          <label>
            {t('produce')}
            <input value={form.produce} onChange={(event) => updateForm('produce', event.target.value)} placeholder={t('producePlaceholder')} required />
          </label>
          <label>
            {t('quantity')}
            <input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => updateForm('quantity', event.target.value)} placeholder={t('quantityPlaceholder')} required />
          </label>
          <label>
            {t('pickupLocation')}
            <input value={form.pickupLocation} onChange={(event) => updateForm('pickupLocation', event.target.value)} placeholder={t('locationPlaceholder')} required />
          </label>
          <label>
            {t('destination')}
            <input value={form.destination} onChange={(event) => updateForm('destination', event.target.value)} placeholder={t('destinationPlaceholder')} required />
          </label>
          <label>
            {t('preferredVehicle')}
            <input value={form.vehicleType} onChange={(event) => updateForm('vehicleType', event.target.value)} placeholder={t('vehicleTypePlaceholder')} />
          </label>
          <label>
            {t('requestedDate')}
            <input type="datetime-local" value={form.requestedDate} onChange={(event) => updateForm('requestedDate', event.target.value)} />
          </label>
        </div>
        <div className="button-row">
          <button type="submit" disabled={loading}>{t('searchTransport')}</button>
          <button type="button" className="btn-ghost" onClick={handleReset} disabled={loading}>{t('reset')}</button>
        </div>
      </form>

      {sampleData ? <p className="notice-text">{t('sampleLogisticsNotice')}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      {selectedProvider ? (
        <LogisticsProviderDetails
          provider={selectedProvider}
          contactNotice={contactNotice}
          onClose={() => setSelectedProvider(null)}
          onRequest={handleRequest}
        />
      ) : null}

      {requestProvider ? (
        <form className="card transport-request-form" onSubmit={submitRequest}>
          <h3>{t('requestTransport')}</h3>
          <p>{requestProvider.providerName} · {requestProvider.vehicleType}</p>
          <p className="session-label">{t('requestSummary')}</p>
          <button type="submit" disabled={requestLoading}>
            {requestLoading ? t('loading') : t('submitTransportRequest')}
          </button>
        </form>
      ) : null}

      <section>
        <h3>{t('transportOptions')}</h3>
        {loading ? <div className="card"><p>{t('loading')}</p></div> : null}
        {!loading && !providers.length ? <div className="card"><p className="empty-cell">{t('noTransportOptions')}</p></div> : null}
        {!loading && providers.length ? (
          <div className="storage-grid">
            {providers.map((provider) => (
              <LogisticsProviderCard
                key={provider._id}
                provider={provider}
                onViewDetails={setSelectedProvider}
                onRequest={handleRequest}
                onContact={handleContact}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h3>{t('myTransportRequests')}</h3>
        {historyLoading ? <div className="card"><p>{t('loading')}</p></div> : null}
        {!historyLoading && !requests.length ? <div className="card"><p className="empty-cell">{t('noTransportRequests')}</p></div> : null}
        {!historyLoading && requests.length ? (
          <div className="request-list">
            {requests.map((request) => (
              <article className="card request-card" key={request._id}>
                <strong>{request.produce}</strong>
                <span>{request.quantity} {request.quantityUnit} · {request.pickupLocation} → {request.destination}</span>
                <span>{request.providerId?.providerName || t('provider')} · {request.status}</span>
                <small>{new Date(request.createdAt).toLocaleString()}</small>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
