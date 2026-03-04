import { useEffect, useState } from 'react';
import api from '../api';

const fallbackSchemes = [
  {
    title: 'PM-KISAN',
    description: 'Income support scheme providing financial assistance to eligible farmer families.',
  },
  {
    title: 'Soil Health Card Scheme',
    description: 'Provides soil nutrient status reports and fertilizer recommendations.',
  },
  {
    title: 'PMFBY',
    description: 'Crop insurance support for farmers against weather and yield loss risks.',
  },
];

export default function SchemesPage() {
  const [schemes, setSchemes] = useState(fallbackSchemes);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const { data } = await api.get('/schemes');

        if (Array.isArray(data) && data.length > 0) {
          setSchemes(
            data.map((item) => ({
              title: item.title || item.name || 'Government Scheme',
              description: item.description || item.details || 'No description available.',
            }))
          );
        }

        setError('');
      } catch (err) {
        setError('Showing default schemes because the API is unavailable.');
      }
    };

    fetchSchemes();
  }, []);

  return (
    <section>
      <h2>Government Schemes</h2>
      {error ? <p className="error-text">{error}</p> : null}

      <div className="schemes-grid">
        {schemes.map((scheme) => (
          <article key={`${scheme.title}-${scheme.description}`} className="card scheme-item">
            <h3>{scheme.title}</h3>
            <p>{scheme.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
