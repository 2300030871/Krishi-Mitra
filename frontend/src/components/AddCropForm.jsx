import { useEffect, useState } from 'react';

const initialState = {
  crop_name: '',
  price: '',
  quantity: '',
  unit: 'kg',
  farmer_id: '',
  location: '',
};

export default function AddCropForm({ farmerId, onCreate, loading }) {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, farmer_id: farmerId || '' }));
  }, [farmerId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate(formData);
    setFormData((prev) => ({
      ...initialState,
      farmer_id: prev.farmer_id,
    }));
  };

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h3>Add Crop</h3>

      <input
        name="crop_name"
        placeholder="Crop name"
        value={formData.crop_name}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        min="0"
        step="0.01"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        min="0"
        step="0.01"
        name="quantity"
        placeholder="Quantity"
        value={formData.quantity}
        onChange={handleChange}
        required
      />
      <select name="unit" value={formData.unit} onChange={handleChange} required>
        <option value="kg">kg</option>
        <option value="quintal">quintal</option>
        <option value="ton">ton</option>
      </select>
      <input
        name="farmer_id"
        placeholder="Farmer ID"
        value={formData.farmer_id}
        onChange={handleChange}
        required
      />
      <input
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={handleChange}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Crop'}
      </button>
    </form>
  );
}
