import { APPROVED_HERO } from '../assets/brand/hero-clean';

export function HeroBanner() {
  return (
    <section className="hero hero--approved" aria-label="Старший Брат — навигатор по сообществу">
      <img
        className="hero__approved-art"
        src={APPROVED_HERO}
        alt="Старший Брат — найдите своего человека в сообществе"
        draggable={false}
      />
    </section>
  );
}
