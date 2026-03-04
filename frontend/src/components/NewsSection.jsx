import { useEffect, useState } from 'react';
import api from '../api';

const fallbackNewsItems = [
  {
    id: 1,
    title: 'Soil moisture advisory released for upcoming sowing window',
    summary: 'Agriculture experts recommend moisture checks before seed placement in early March.',
  },
  {
    id: 2,
    title: 'Regional mandi arrivals increase for wheat and mustard',
    summary: 'Traders report healthy inflow volumes and stable buyer demand this week.',
  },
  {
    id: 3,
    title: 'State extension teams begin pest surveillance drive',
    summary: 'Field officers are collecting crop health data to issue localized alerts to farmers.',
  },
];

export default function NewsSection() {
  const [newsItems, setNewsItems] = useState(fallbackNewsItems);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await api.get('/news');

        if (Array.isArray(data) && data.length > 0) {
          setNewsItems(
            data.map((item, index) => ({
              id: item._id || index,
              title: item.title || 'Agriculture Update',
              summary: item.summary || item.description || 'No summary available.',
            }))
          );
        }
      } catch (error) {
        setNewsItems(fallbackNewsItems);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="card news-card">
      <h3>Latest Agriculture News</h3>
      <div className="news-list">
        {newsItems.map((item) => (
          <article key={item.id} className="news-item">
            <h4>{item.title}</h4>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
