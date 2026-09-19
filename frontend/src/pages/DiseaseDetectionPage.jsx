import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DiseaseResult from '../components/DiseaseResult';
import DiseaseScanForm from '../components/DiseaseScanForm';
import { analyzeDisease, getDiagnosisById, getMyDiagnoses } from '../services/diseaseService';
import { isConnectivityError, isOnline } from '../services/connectivityService';
import { createClientRequestId, enqueueAction } from '../services/offlineStorage';
import { emitToast } from '../toast';

export default function DiseaseDetectionPage() {
  const { t } = useTranslation();
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getMyDiagnoses();
      setDiagnoses(data.diagnoses || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load previous scans.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAnalyze = async (formData) => {
    setLoading(true);
    const requestId = createClientRequestId();
    const payload = {
      crop: formData.get('crop'),
      image: formData.get('image'),
      imageName: formData.get('image')?.name || 'crop-image',
      imageType: formData.get('image')?.type || 'image/jpeg',
    };

    const queueAnalysis = async () => {
      await enqueueAction({
        actionType: 'disease-analysis',
        endpoint: '/disease-detection/analyze',
        payload,
        requestId,
      });
      setError(t('offlineAnalysisQueued'));
      emitToast(t('offlineAnalysisQueued'), 'warning');
      return { queued: true };
    };

    if (!isOnline()) {
      setLoading(false);
      return queueAnalysis();
    }

    try {
      const diagnosis = await analyzeDisease(formData, requestId);
      setSelectedDiagnosis(diagnosis);
      await loadHistory();
      setError('');
      return { diagnosis };
    } catch (err) {
      if (isConnectivityError(err)) return queueAnalysis();
      setError(err.response?.data?.message || 'Failed to analyze crop image.');
      return { queued: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleSync = (event) => {
      if (event.detail?.actionType === 'disease-analysis') loadHistory();
    };
    window.addEventListener('agrimandi-sync-complete', handleSync);
    return () => window.removeEventListener('agrimandi-sync-complete', handleSync);
  }, []);

  const handleView = async (id) => {
    try {
      const diagnosis = await getDiagnosisById(id);
      setSelectedDiagnosis(diagnosis);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load diagnosis.');
    }
  };

  const openTreatment = (diagnosis) => {
    const params = new URLSearchParams({
      crop: diagnosis.crop,
      disease: diagnosis.diseaseOrPest,
    });
    window.history.pushState(null, '', `/treatment?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <section className="disease-page">
      <div>
        <p className="session-label">{t('cropCare')}</p>
        <h2>{t('diseaseDetection')}</h2>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <DiseaseScanForm onAnalyze={handleAnalyze} loading={loading} />
      <DiseaseResult diagnosis={selectedDiagnosis} onViewTreatment={openTreatment} />

      <section className="card">
        <h3>{t('previousScans')}</h3>
        {historyLoading ? <p>{t('loading')}</p> : null}
        {!historyLoading && !diagnoses.length ? <p className="empty-cell">{t('noPreviousScans')}</p> : null}
        {!historyLoading && diagnoses.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('crop')}</th>
                  <th>{t('diseaseOrPest')}</th>
                  <th>{t('confidence')}</th>
                  <th>{t('severity')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {diagnoses.map((diagnosis) => (
                  <tr key={diagnosis._id}>
                    <td>{new Date(diagnosis.createdAt).toLocaleDateString()}</td>
                    <td>{diagnosis.crop}</td>
                    <td>{diagnosis.diseaseOrPest}</td>
                    <td>{diagnosis.confidence}%</td>
                    <td>{diagnosis.severity}</td>
                    <td><button className="btn-small" onClick={() => handleView(diagnosis._id)}>{t('viewResult')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </section>
  );
}
