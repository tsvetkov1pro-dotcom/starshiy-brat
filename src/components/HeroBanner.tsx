import HERO_HQ_BASE64 from '../assets/brand/hero-hq/chunk0';

const HERO_HQ = `data:image/webp;base64,${HERO_HQ_BASE64}`;

export function HeroBanner() {
  return (
    <section className="hero hero--approved" aria-label="Старший Брат — навигатор по сообществу">
      <img
        className="hero__approved-art"
        src={HERO_HQ}
        alt="Старший Брат — найдите своего человека в сообществе"
        draggable={false}
      />
    </section>
  );
}
