import { useState } from 'react';

export default function FarmerCropTable({ crops, onUpdate, onDelete, loading }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    crop_name: '',
    price: '',
    quantity: '',
    location: '',
  });

  const startEdit = (crop) => {
    setEditingId(crop._id);
    setEditData({
      crop_name: crop.crop_name,
      price: crop.price,
      quantity: crop.quantity,
      location: crop.location,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ crop_name: '', price: '', quantity: '', location: '' });
  };

  const saveEdit = async (id) => {
    await onUpdate(id, editData);
    cancelEdit();
  };

  return (
    <div className="card">
      <h3>Your Crops</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Location</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {crops.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  No crops found for this farmer ID.
                </td>
              </tr>
            ) : (
              crops.map((crop) => {
                const isEditing = editingId === crop._id;
                return (
                  <tr key={crop._id}>
                    <td>
                      {isEditing ? (
                        <input
                          value={editData.crop_name}
                          onChange={(event) =>
                            setEditData((prev) => ({ ...prev, crop_name: event.target.value }))
                          }
                        />
                      ) : (
                        crop.crop_name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.price}
                          onChange={(event) =>
                            setEditData((prev) => ({ ...prev, price: event.target.value }))
                          }
                        />
                      ) : (
                        `₹${crop.price}`
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.quantity}
                          onChange={(event) =>
                            setEditData((prev) => ({ ...prev, quantity: event.target.value }))
                          }
                        />
                      ) : (
                        crop.quantity
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          value={editData.location}
                          onChange={(event) =>
                            setEditData((prev) => ({ ...prev, location: event.target.value }))
                          }
                        />
                      ) : (
                        crop.location
                      )}
                    </td>
                    <td>{new Date(crop.created_at).toLocaleString()}</td>
                    <td className="actions-cell">
                      {isEditing ? (
                        <>
                          <button
                            className="btn-small"
                            disabled={loading}
                            onClick={() => saveEdit(crop._id)}
                          >
                            Save
                          </button>
                          <button className="btn-small btn-ghost" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-small" onClick={() => startEdit(crop)}>
                            Edit
                          </button>
                          <button
                            className="btn-small btn-danger"
                            disabled={loading}
                            onClick={() => onDelete(crop._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
