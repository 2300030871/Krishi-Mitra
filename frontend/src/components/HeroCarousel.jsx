import { useEffect, useState } from 'react';

const images = [
  '/banners/farmer-field.svg',
  '/banners/harvest-basket.svg',
  '/banners/irrigated-crops.svg',
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [index]);

  const changeSlide = (change) => {
    setImageFailed(false);
    setIndex(change);
  };

  return (
    <div className="hero-carousel">
      {!imageFailed ? (
        <img
          src={images[index]}
          alt="Agriculture banner"
          className="hero-image"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="hero-image hero-image-fallback" role="img" aria-label="Agriculture banner" />
      )}
      <button className="carousel-btn left" onClick={() => changeSlide((index - 1 + images.length) % images.length)} aria-label="Previous image">
        ‹
      </button>
      <button className="carousel-btn right" onClick={() => changeSlide((index + 1) % images.length)} aria-label="Next image">
        ›
      </button>
    </div>
  );
}
