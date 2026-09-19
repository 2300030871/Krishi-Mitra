import { useTranslation } from 'react-i18next';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (String(imagePath).startsWith('http')) return imagePath;
  return `${API_ORIGIN}${String(imagePath).startsWith('/') ? imagePath : `/${imagePath}`}`;
};

const listValue = (items) => (items?.length ? items.join(', ') : '-');

export default function DiseaseResult({ diagnosis, onViewTreatment }) {
  const { t } = useTranslation();
  if (!diagnosis) return null;

  return (
    <article className="card disease-result">
      <div className="disease-result-heading">
        <div>
          <h3>{t('detectionResult')}</h3>
          <p className="session-label">{new Date(diagnosis.createdAt).toLocaleString()}</p>
        </div>
        {diagnosis.imagePath ? <img className="disease-result-image" src={resolveImageUrl(diagnosis.imagePath)} alt={diagnosis.crop} /> : null}
      </div>
      {diagnosis.detectionSource === 'mock' ? (
        <p className="notice-text">
          {t('demoDetection')}: {t('demoDetectionMessage')}
        </p>
      ) : null}
      <dl className="disease-details">
        <div><dt>{t('crop')}</dt><dd>{diagnosis.crop}</dd></div>
        <div><dt>{t('diseaseOrPest')}</dt><dd>{diagnosis.diseaseOrPest}</dd></div>
        <div><dt>{t('diagnosisType')}</dt><dd>{diagnosis.diagnosisType}</dd></div>
        <div><dt>{t('confidence')}</dt><dd>{diagnosis.confidence}%</dd></div>
        <div><dt>{t('severity')}</dt><dd>{diagnosis.severity}</dd></div>
        <div><dt>{t('detectionSource')}</dt><dd>{diagnosis.detectionSource}</dd></div>
        <div><dt>{t('symptoms')}</dt><dd>{listValue(diagnosis.symptoms)}</dd></div>
        <div><dt>{t('possibleCauses')}</dt><dd>{listValue(diagnosis.possibleCauses)}</dd></div>
        <div><dt>{t('prevention')}</dt><dd>{listValue(diagnosis.prevention)}</dd></div>
      </dl>
      <button type="button" className="btn-ghost" onClick={() => onViewTreatment(diagnosis)}>
        {t('viewTreatment')}
      </button>
    </article>
  );
}
