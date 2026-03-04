export default function BuyerFilters({ filters, onChange, onApply, onReset }) {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card form-grid">
      <h3>Search & Filter</h3>
      <input
        name="crop_name"
        placeholder="Search by crop name"
        value={filters.crop_name}
        onChange={handleInputChange}
      />
      <input
        name="location"
        placeholder="Filter by location"
        value={filters.location}
        onChange={handleInputChange}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        name="minPrice"
        placeholder="Min price"
        value={filters.minPrice}
        onChange={handleInputChange}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        name="maxPrice"
        placeholder="Max price"
        value={filters.maxPrice}
        onChange={handleInputChange}
      />

      <div className="button-row">
        <button onClick={onApply}>Apply Filters</button>
        <button className="btn-ghost" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
