import HeroCarousel from '../components/HeroCarousel';
import HomeTiles from '../components/HomeTiles';
import WeatherCard from '../components/WeatherCard';
import QuickTipsCard from '../components/QuickTipsCard';
import NewsSection from '../components/NewsSection';

export default function HomePage({ onNavigate }) {
  return (
    <section>
      <HeroCarousel />
      <HomeTiles onNavigate={onNavigate} />

      <div className="home-info-grid">
        <WeatherCard />
        <QuickTipsCard />
      </div>

      <NewsSection />
    </section>
  );
}
