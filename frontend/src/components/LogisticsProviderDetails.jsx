import { useTranslation } from 'react-i18next';

export default function LogisticsProviderDetails({ provider, contactNotice, onClose, onRequest }) {
  const { t } = useTranslation();
  if (!provider) return null;

  return (
    <section className="card storage-details">
      <div className="storage-details-heading">
        <div>
          <p className="session-label">{t('providerDetails')}</p>
          <h3>{provider.providerName}</h3>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>{t('close')}</button>
      </div>
      {provider.dataSource === 'sample' ? <p className="notice-text">{t('sampleLogisticsNotice')}</p> : null}
      {contactNotice ? <p className="success-text">{contactNotice}</p> : null}
      <div className="storage-detail-grid">
        <div><strong>{t('vehicleType')}:</strong> {provider.vehicleType}</div>
        <div><strong>{t('vehicleCapacity')}:</strong> {provider.vehicleCapacity ?? '-'} {provider.capacityUnit}</div>
        <div><strong>{t('serviceArea')}:</strong> {provider.serviceAreas?.join(', ') || '-'}</div>
        <div><strong>{t('supportedProduce')}:</strong> {provider.supportedProduce?.join(', ') || '-'}</div>
        <div><strong>{t('estimatedDistance')}:</strong> {provider.estimatedDistanceKm != null ? `${provider.estimatedDistanceKm} km` : '-'}</div>
        <div><strong>{t('estimatedCost')}:</strong> {provider.estimatedCost != null ? `Rs ${provider.estimatedCost}` : '-'}</div>
        <div><strong>{t('contact')}:</strong> {provider.contact?.contactPerson || '-'} {provider.contact?.phone || ''} {provider.contact?.email || ''}</div>
        <div><strong>{t('availability')}:</strong> {provider.availabilityStatus || t('unknown')}</div>
      </div>
      <button type="button" onClick={() => onRequest(provider)}>{t('requestTransport')}</button>
    </section>
  );
}
