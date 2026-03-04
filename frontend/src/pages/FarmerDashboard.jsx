import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';
import { getStoredUser, setStoredUser } from '../auth';
import { emitToast } from '../toast';
import { createCrop, deleteCrop, getMyCrops, updateCrop } from '../services/cropService';
import { updateLanguagePreference } from '../services/userService';
import ChatPanel from '../components/ChatPanel';

const sidebarItems = [
  { key: 'my-crops', labelKey: 'myCrops' },
  { key: 'add-crop', labelKey: 'addCrop' },
  { key: 'messages', labelKey: 'messages' },
  { key: 'settings', labelKey: 'settings' },
];

const initialForm = {
  name: '',
  price: '',
  quantity: '',
  unit: 'kg',
  location: '',
  description: '',
  image: null,
};

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (String(url).startsWith('http')) return url;
  return `${API_ORIGIN}${url}`;
};

export default function FarmerDashboard() {
  const { t, i18n } = useTranslation();
  const currentUser = getStoredUser();

  const toI18nCode = (language) => {
    const value = String(language || '').toLowerCase();
    if (value === 'hindi' || value === 'hi') return 'hi';
    if (value === 'telugu' || value === 'te') return 'te';
    return 'en';
  };

  const [activePanel, setActivePanel] = useState('my-crops');
  const [crops, setCrops] = useState([]);
  const [cropForm, setCropForm] = useState(initialForm);
  const [editingCropId, setEditingCropId] = useState('');
  const [language, setLanguage] = useState(currentUser?.preferredLanguage || 'english');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMyCrops = async () => {
    try {
      const data = await getMyCrops();
      setCrops(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load crops.');
    }
  };

  useEffect(() => {
    if (currentUser?.preferredLanguage) {
      i18n.changeLanguage(toI18nCode(currentUser.preferredLanguage));
    }

    if (currentUser?.id) {
      socket.emit('user:online', currentUser.id);
    }

    loadMyCrops();

    const sync = () => loadMyCrops();
    socket.on('cropAdded', sync);
    socket.on('cropUpdated', sync);
    socket.on('cropDeleted', sync);

    return () => {
      socket.off('cropAdded', sync);
      socket.off('cropUpdated', sync);
      socket.off('cropDeleted', sync);
    };
  }, []);

  const resetCropForm = () => {
    setCropForm(initialForm);
    setEditingCropId('');
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append('name', cropForm.name);
    formData.append('price', cropForm.price);
    formData.append('quantity', cropForm.quantity);
    formData.append('unit', cropForm.unit);
    formData.append('location', cropForm.location);
    formData.append('description', cropForm.description);

    if (cropForm.image) {
      formData.append('image', cropForm.image);
    }

    return formData;
  };

  const handleCropSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = buildFormData();

      if (editingCropId) {
        await updateCrop(editingCropId, formData);
        emitToast('Crop updated successfully.', 'success');
      } else {
        await createCrop(formData);
        emitToast('Crop created successfully.', 'success');
      }

      await loadMyCrops();
      resetCropForm();
      setError('');
      setActivePanel('my-crops');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save crop.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = async (id) => {
    const confirmed = window.confirm('Delete this crop?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteCrop(id);
      await loadMyCrops();
      emitToast('Crop deleted successfully.', 'success');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete crop.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (crop) => {
    setEditingCropId(crop._id);
    setCropForm({
      name: crop.name || crop.crop_name || '',
      price: String(crop.price || ''),
      quantity: String(crop.quantity || ''),
      unit: crop.unit || 'kg',
      location: crop.location || '',
      description: crop.description || '',
      image: null,
    });
    setActivePanel('add-crop');
  };

  const handleSaveLanguage = async () => {
    setLoading(true);
    try {
      const user = await updateLanguagePreference(language);
      await i18n.changeLanguage(toI18nCode(user.preferredLanguage));

      const existing = getStoredUser();
      if (existing) {
        setStoredUser({
          ...existing,
          preferredLanguage: user.preferredLanguage,
        });
      }

      emitToast('Language updated successfully.', 'success');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save language.');
    } finally {
      setLoading(false);
    }
  };

  const renderMyCrops = () => {
    if (!crops.length) {
      return (
        <div className="card">
          <p className="empty-cell">{t('noCrops')}</p>
        </div>
      );
    }

    return (
      <div className="farmer-crop-grid">
        {crops.map((crop) => (
          <article className="card farmer-crop-card" key={crop._id}>
            {crop.imageUrl ? <img className="farmer-crop-image" src={resolveAssetUrl(crop.imageUrl)} alt={crop.name || crop.crop_name} /> : null}
            <h3>{crop.name || crop.crop_name}</h3>
            <p>
              <strong>{t('price')}:</strong> ₹{crop.price}
            </p>
            <p>
              <strong>{t('quantity')}:</strong> {crop.quantity} {crop.unit || 'kg'}
            </p>
            <p>
              <strong>{t('location')}:</strong> {crop.location}
            </p>
            {crop.description ? <p>{crop.description}</p> : null}
            <div className="button-row">
              <button className="btn-ghost" onClick={() => openEdit(crop)}>
                Edit
              </button>
              <button className="btn-danger" onClick={() => handleDeleteCrop(crop._id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderCropForm = () => (
    <form className="card farmer-form" onSubmit={handleCropSubmit}>
      <div className="form-grid">
        <input
          placeholder={t('cropName')}
          value={cropForm.name}
          onChange={(event) => setCropForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder={t('price')}
          value={cropForm.price}
          onChange={(event) => setCropForm((prev) => ({ ...prev, price: event.target.value }))}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder={t('quantity')}
          value={cropForm.quantity}
          onChange={(event) => setCropForm((prev) => ({ ...prev, quantity: event.target.value }))}
          required
        />
        <select
          value={cropForm.unit}
          onChange={(event) => setCropForm((prev) => ({ ...prev, unit: event.target.value }))}
          required
        >
          <option value="kg">kg</option>
          <option value="quintal">quintal</option>
          <option value="ton">ton</option>
        </select>
        <input
          placeholder={t('location')}
          value={cropForm.location}
          onChange={(event) => setCropForm((prev) => ({ ...prev, location: event.target.value }))}
          required
        />
      </div>
      <textarea
        className="farmer-textarea"
        placeholder={t('description')}
        value={cropForm.description}
        onChange={(event) => setCropForm((prev) => ({ ...prev, description: event.target.value }))}
      />
      <div className="farmer-file-row">
        <label>{t('image')}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setCropForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }))}
        />
      </div>
      <div className="button-row">
        <button type="submit" disabled={loading}>
          {loading ? t('loading') : editingCropId ? t('updateCrop') : t('createCrop')}
        </button>
        {editingCropId ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              resetCropForm();
              setActivePanel('my-crops');
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );

  const renderMessages = () => <ChatPanel title={t('messages')} />;

  const renderSettings = () => (
    <div className="card farmer-settings">
      <h3>{t('settings')}</h3>
      <div className="form-grid">
        <div>
          <label>{t('language')}</label>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="telugu">Telugu</option>
          </select>
        </div>
      </div>
      <div className="button-row">
        <button type="button" onClick={handleSaveLanguage} disabled={loading}>
          {t('saveSettings')}
        </button>
      </div>
    </div>
  );

  return (
    <section className="farmer-shell">
      <aside className="card farmer-sidebar">
        <h2>{t('farmerDashboard')}</h2>
        <div className="farmer-sidebar-items">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={activePanel === item.key ? 'farmer-side-btn active' : 'farmer-side-btn'}
              onClick={() => setActivePanel(item.key)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </aside>

      <div className="farmer-main">
        {error ? <p className="error-text">{error}</p> : null}

        {activePanel === 'my-crops' ? renderMyCrops() : null}
        {activePanel === 'add-crop' ? renderCropForm() : null}
        {activePanel === 'messages' ? renderMessages() : null}
        {activePanel === 'settings' ? renderSettings() : null}
      </div>
    </section>
  );
}
