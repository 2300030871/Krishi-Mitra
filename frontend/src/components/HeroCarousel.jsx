import { useEffect, useState } from 'react';

const images = [
  'https://res.cloudinary.com/dp55vvd7j/image/upload/v1758301493/farmer-banner_im2nez.jpg',
  'https://res.cloudinary.com/dp55vvd7j/image/upload/v1758301491/Template-landscape-of-agriculture-and-farming-on-banner-8-large_rpvtor.jpg',
  'https://res.cloudinary.com/dp55vvd7j/image/upload/v1758301487/image1_ttsey7.webp',
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const prev = () => setIndex((current) => (current - 1 + images.length) % images.length);
  const next = () => setIndex((current) => (current + 1) % images.length);

  return (
    <div className="hero-carousel">
      <img src={images[index]} alt="Agri banner" className="hero-image" />
      <button className="carousel-btn left" onClick={prev} aria-label="Previous image">
        ‹
      </button>
      <button className="carousel-btn right" onClick={next} aria-label="Next image">
        ›
      </button>
    </div>
  );
}
