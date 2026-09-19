import { useTranslation } from 'react-i18next';

const listValue = (items) => (items?.length ? items.join(', ') : '-');

export default function StorageDetails({ storage, contactNotice, onClose }) {
  const { t } = useTranslation();
  if (!storage) return null;

  return (
    <section className="card storage-details">
      <div className="storage-details-heading">
        <div>
          <p className="session-label">{t('storageDetails')}</p>
          <h3>{storage.name}</h3>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>{t('close')}</button>
      </div>
      {storage.dataSource === 'sample' ? <p className="notice-text">{t('sampleAvailabilityNotice')}</p> : null}
      {contactNotice ? <p className="success-text">{contactNotice}</p> : null}
      <div className="storage-detail-grid">
        <div><strong>{t('location')}:</strong> {storage.location}</div>
        <div><strong>{t('address')}:</strong> {storage.address || '-'}</div>
        <div><strong>{t('storageType')}:</strong> {storage.storageType}</div>
        <div><strong>{t('distance')}:</strong> {storage.distanceKm !== undefined ? `${storage.distanceKm} km` : '-'}</div>
        <div><strong>{t('capacity')}:</strong> {storage.capacity ?? '-'} {storage.capacity ? t('capacityUnit') : ''}</div>
        <div><strong>{t('availableCapacity')}:</strong> {storage.availableCapacity ?? '-'} {storage.availableCapacity ? t('capacityUnit') : ''}</div>
        <div><strong>{t('supportedProduce')}:</strong> {listValue(storage.supportedProduce)}</div>
        <div><strong>{t('operatingHours')}:</strong> {storage.operatingHours || '-'}</div>
        <div><strong>{t('contact')}:</strong> {storage.contact?.contactPerson || '-'} {storage.contact?.phone || ''} {storage.contact?.email || ''}</div>
        <div><strong>{t('facilities')}:</strong> {listValue(storage.facilities)}</div>
      </div>
    </section>
  );
}
