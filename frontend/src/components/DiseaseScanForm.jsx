import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteDraft, getDraft, saveDraft } from '../services/offlineStorage';

const crops = ['Tomato', 'Rice', 'Potato', 'Cotton', 'Chilli'];

export default function DiseaseScanForm({ onAnalyze, loading }) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const cameraInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const draftLoaded = useRef(false);

  useEffect(() => {
    getDraft('disease-scan-form').then((draft) => {
      if (draft?.data) {
        setCrop(draft.data.crop || '');
        if (draft.data.image) {
          const image = typeof File === 'undefined' || draft.data.image instanceof File
            ? draft.data.image
            : new File([draft.data.image], draft.data.imageName || 'crop-image', { type: draft.data.imageType || draft.data.image.type });
          setImage(image);
        }
      }
      draftLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) return;
    saveDraft('disease-scan-form', {
      crop,
      image,
      imageName: image?.name || '',
      imageType: image?.type || '',
    });
  }, [crop, image]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const selectImage = (event) => {
    setImage(event.target.files?.[0] || null);
    event.target.value = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('crop', crop);
    formData.append('image', image);
    const result = await onAnalyze(formData);
    if (!result?.queued) await deleteDraft('disease-scan-form');
  };

  return (
    <form className="card disease-scan-form" onSubmit={submit}>
      <h3>{t('diseaseDetection')}</h3>
      <label htmlFor="disease-crop">{t('selectCrop')}</label>
      <select id="disease-crop" value={crop} onChange={(event) => setCrop(event.target.value)} required>
        <option value="">{t('selectCrop')}</option>
        {crops.map((cropName) => (
          <option key={cropName} value={cropName}>
            {cropName}
          </option>
        ))}
      </select>

      <input ref={cameraInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={selectImage} />
      <input ref={imageInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} />
      <div className="button-row">
        <button type="button" className="btn-ghost" onClick={() => cameraInputRef.current?.click()}>
          {t('takePhoto')}
        </button>
        <button type="button" className="btn-ghost" onClick={() => imageInputRef.current?.click()}>
          {t('chooseImage')}
        </button>
      </div>
      <p className="session-label">{image ? image.name : t('uploadImage')}</p>
      {previewUrl ? <img className="disease-preview" src={previewUrl} alt={t('uploadCropImage')} /> : null}
      <button type="submit" disabled={loading || !crop || !image}>
        {loading ? t('analyzing') : t('analyzeCrop')}
      </button>
    </form>
  );
}
