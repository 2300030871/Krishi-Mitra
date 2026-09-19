import { useTranslation } from 'react-i18next';

export default function LogisticsProviderCard({ provider, onViewDetails, onRequest, onContact }) {
  const { t } = useTranslation();

  return (
    <article className="card logistics-provider-card">
      <div className="storage-card-heading">
        <div>
          <h3>{provider.providerName}</h3>
          <p className="storage-location">{provider.vehicleType}</p>
        </div>
        {provider.dataSource === 'sample' ? <span className="sample-badge">{t('sampleData')}</span> : null}
      </div>
      <dl className="storage-summary">
        <div><dt>{t('vehicleCapacity')}</dt><dd>{provider.vehicleCapacity ?? '-'} {provider.capacityUnit}</dd></div>
        <div><dt>{t('serviceArea')}</dt><dd>{provider.serviceAreas?.join(', ') || '-'}</dd></div>
        <div><dt>{t('estimatedCost')}</dt><dd>{provider.estimatedCost != null ? `Rs ${provider.estimatedCost}` : '-'}</dd></div>
        <div><dt>{t('availability')}</dt><dd>{provider.availabilityStatus || t('unknown')}</dd></div>
      </dl>
      <p><strong>{t('supportedProduce')}:</strong> {provider.supportedProduce?.join(', ') || '-'}</p>
      <div className="button-row">
        <button type="button" onClick={() => onViewDetails(provider)}>{t('viewDetails')}</button>
        <button type="button" onClick={() => onRequest(provider)}>{t('requestTransport')}</button>
        <button type="button" className="btn-ghost" onClick={() => onContact(provider)}>{t('contact')}</button>
      </div>
    </article>
  );
}
