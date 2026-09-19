import { useTranslation } from 'react-i18next';

const listValue = (items) => (items?.length ? items.join(', ') : '-');

export default function StorageCard({ storage, onViewDetails, onContact }) {
  const { t } = useTranslation();

  return (
    <article className="card storage-card">
      <div className="storage-card-heading">
        <div>
          <h3>{storage.name}</h3>
          <p className="storage-location">{storage.location}</p>
        </div>
        {storage.dataSource === 'sample' ? <span className="sample-badge">{t('sampleData')}</span> : null}
      </div>
      <dl className="storage-summary">
        <div><dt>{t('storageType')}</dt><dd>{storage.storageType}</dd></div>
        <div><dt>{t('capacity')}</dt><dd>{storage.capacity ?? '-'} {storage.capacity ? t('capacityUnit') : ''}</dd></div>
        <div><dt>{t('availableCapacity')}</dt><dd>{storage.availableCapacity ?? '-'} {storage.availableCapacity ? t('capacityUnit') : ''}</dd></div>
        {storage.distanceKm !== undefined ? <div><dt>{t('distance')}</dt><dd>{storage.distanceKm} km</dd></div> : null}
      </dl>
      <p><strong>{t('supportedProduce')}:</strong> {listValue(storage.supportedProduce)}</p>
      <div className="button-row">
        <button type="button" onClick={() => onViewDetails(storage)}>{t('viewDetails')}</button>
        <button type="button" className="btn-ghost" onClick={() => onContact(storage)}>{t('contact')}</button>
      </div>
    </article>
  );
}
