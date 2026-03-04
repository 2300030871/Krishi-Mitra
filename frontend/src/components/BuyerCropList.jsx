export default function BuyerCropList({ crops }) {
  return (
    <div className="card">
      <h3>Available Crops</h3>
      <div className="crop-grid">
        {crops.length === 0 ? (
          <p className="empty-cell">No crops found for selected filters.</p>
        ) : (
          crops.map((crop) => (
            <article key={crop._id} className="crop-item">
              <h4>{crop.crop_name}</h4>
              <p>
                <strong>Price:</strong> ₹{crop.price}
              </p>
              <p>
                <strong>Quantity:</strong> {crop.quantity} {crop.unit || 'kg'}
              </p>
              <p>
                <strong>Location:</strong> {crop.location}
              </p>
              <p>
                <strong>Farmer ID:</strong> {crop.farmer_id}
              </p>
              <small>Added: {new Date(crop.created_at).toLocaleString()}</small>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
