import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredUser } from '../auth';
import { getTreatment } from '../services/treatmentService';

const sections = [
  ['symptoms', 'symptoms'],
  ['immediateActions', 'immediateActions'],
  ['treatmentOptions', 'treatmentOptions'],
  ['organicMethods', 'organicMethods'],
  ['prevention', 'prevention'],
  ['safetyNotes', 'safetyNotes'],
  ['expertAdvice', 'expertAdvice'],
];

export default function TreatmentGuidancePage({ onBack }) {
  const { t, i18n } = useTranslation();
  const [treatment, setTreatment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const crop = params.get('crop') || '';
    const diseaseOrPest = params.get('disease') || '';
    const language = getStoredUser()?.preferredLanguage || i18n.language;

    if (!crop || !diseaseOrPest) {
      setError(t('treatmentDetailsMissing'));
      setLoading(false);
      return;
    }

    getTreatment({ crop, diseaseOrPest, language })
      .then((data) => {
        setTreatment(data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || t('treatmentLoadError'));
      })
      .finally(() => setLoading(false));
  }, [i18n.language, t]);

  return (
    <section className="treatment-page">
      <div className="treatment-page-header">
        <div>
          <p className="session-label">{t('cropCare')}</p>
          <h2>{t('treatmentGuidance')}</h2>
        </div>
        <button type="button" className="btn-ghost" onClick={onBack}>{t('backToDetection')}</button>
      </div>

      {loading ? <div className="card"><p>{t('loading')}</p></div> : null}
      {!loading && error ? <div className="card"><p className="error-text">{error}</p></div> : null}
      {!loading && !error && !treatment ? <div className="card"><p className="empty-cell">{t('noTreatmentGuidance')}</p></div> : null}

      {!loading && !error && treatment ? (
        <>
          <div className="card treatment-summary">
            <div>
              <p className="session-label">{t('crop')}</p>
              <h3>{treatment.crop}</h3>
            </div>
            <div>
              <p className="session-label">{t('diseaseOrPest')}</p>
              <h3>{treatment.diseaseOrPest}</h3>
            </div>
            <span className="lang-pill">{treatment.language}</span>
          </div>

          <p className="notice-text">{t('treatmentSafetyNotice')}</p>

          <div className="treatment-grid">
            {sections.map(([field, titleKey]) => (
              <article className="card treatment-card" key={field}>
                <h3>{t(titleKey)}</h3>
                {treatment[field]?.length ? (
                  <ul>
                    {treatment[field].map((item, index) => <li key={`${field}-${index}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="empty-cell">{t('noGuidanceForSection')}</p>
                )}
              </article>
            ))}
          </div>
          <p className="session-label">{treatment.sourceNote}</p>
        </>
      ) : null}
    </section>
  );
}
