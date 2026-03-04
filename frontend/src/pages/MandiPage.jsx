import { useEffect, useMemo, useState } from 'react';
import api from '../api';

export default function MandiPage() {
  const [items, setItems] = useState([]);
  const [stateFilter, setStateFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMandi = async () => {
      try {
        const { data } = await api.get('/mandi');
        setItems(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load mandi prices.');
      }
    };

    fetchMandi();
  }, []);

  const states = useMemo(() => ['all', ...new Set(items.map((item) => item.state).filter(Boolean))], [items]);

  const crops = useMemo(() => {
    const relevant = stateFilter === 'all' ? items : items.filter((item) => item.state === stateFilter);
    return ['all', ...new Set(relevant.map((item) => item.crop).filter(Boolean))];
  }, [items, stateFilter]);

  const filteredRows = useMemo(() => {
    return items.filter((item) => {
      const stateOk = stateFilter === 'all' || item.state === stateFilter;
      const cropOk = cropFilter === 'all' || item.crop === cropFilter;
      return stateOk && cropOk;
    });
  }, [items, stateFilter, cropFilter]);

  return (
    <section>
      <h2>Mandi Prices</h2>
      {error ? <p className="error-text">{error}</p> : null}

      <div className="card mandi-filters">
        <div>
          <label htmlFor="mandi-state">State</label>
          <select
            id="mandi-state"
            value={stateFilter}
            onChange={(event) => {
              setStateFilter(event.target.value);
              setCropFilter('all');
            }}
          >
            {states.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName === 'all' ? 'All states' : stateName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mandi-crop">Crop</label>
          <select id="mandi-crop" value={cropFilter} onChange={(event) => setCropFilter(event.target.value)}>
            {crops.map((cropName) => (
              <option key={cropName} value={cropName}>
                {cropName === 'all' ? 'All crops' : cropName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>Crop</th>
                <th>Price (₹/Quintal)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-cell">
                    No mandi data available.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={`${row.state}-${row.crop}-${index}`}>
                    <td>{row.state}</td>
                    <td>{row.crop}</td>
                    <td>{row.price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
