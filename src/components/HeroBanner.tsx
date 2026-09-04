import { HERO_ART } from '../assets/brand/hero';

export function HeroBanner() {
  return (
    <section className="hero hero--approved" aria-label="Старший Брат — навигатор по сообществу">
      <img
        className="hero__approved-art"
        src={HERO_ART}
        alt="Старший Брат — найдите своего человека в сообществе"
        draggable={false}
      />
    </section>
  );
}
