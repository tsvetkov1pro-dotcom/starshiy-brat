import { BrandLogo } from './BrandLogo';

export function HeroBanner() {
  return (
    <section className="hero hero--approved" aria-label="Старший Брат — навигатор по сообществу">
      <svg className="hero-scene" viewBox="0 0 1400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="heroSky" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#080807" />
            <stop offset=".55" stopColor="#1d1712" />
            <stop offset="1" stopColor="#a45c23" />
          </linearGradient>
          <radialGradient id="heroSun" cx="78%" cy="43%" r="36%">
            <stop offset="0" stopColor="#ffd58b" stopOpacity="1" />
            <stop offset=".2" stopColor="#f0a046" stopOpacity=".94" />
            <stop offset=".58" stopColor="#c0601f" stopOpacity=".28" />
            <stop offset="1" stopColor="#b44e18" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="heroRoad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#24201c" />
            <stop offset="1" stopColor="#090909" />
          </linearGradient>
          <filter id="heroGlow"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        <rect width="1400" height="300" fill="url(#heroSky)" />
        <circle cx="1110" cy="132" r="112" fill="#e37b2c" opacity=".2" filter="url(#heroGlow)" />
        <circle cx="1110" cy="132" r="96" fill="url(#heroSun)" />

        <g fill="#0e0e0d">
          <path d="M0 18h350v220H0z" /><path d="M300 42h228v196H300z" /><path d="M486 70h205v168H486z" />
          <path d="M1160 66h240v172h-240z" opacity=".86" />
        </g>
        <g fill="#b87836" opacity=".5">
          {Array.from({ length: 9 }).map((_, column) => Array.from({ length: 5 }).map((__, row) => (
            <rect key={`l-${column}-${row}`} x={28 + column * 34} y={42 + row * 34} width="9" height="14" rx="1" opacity={(column + row) % 3 === 0 ? .92 : .35} />
          )))}
          {Array.from({ length: 6 }).map((_, column) => Array.from({ length: 4 }).map((__, row) => (
            <rect key={`m-${column}-${row}`} x={332 + column * 31} y={70 + row * 35} width="8" height="13" rx="1" opacity={(column + row) % 2 === 0 ? .72 : .28} />
          )))}
        </g>

        <rect y="222" width="1400" height="78" fill="url(#heroRoad)" />
        <path d="M0 248c290-15 570-16 860-3 241 11 404 4 540-4v59H0z" fill="#11100f" />

        <g transform="translate(170 174)">
          <ellipse cx="160" cy="76" rx="182" ry="16" fill="#050505" opacity=".7" />
          <path d="M12 54 46 22c20-19 55-29 105-31l84 2c34 2 58 12 80 35l35 34v32H5z" fill="#090a0a" stroke="#2f2b27" strokeWidth="3" />
          <path d="M67 24c17-16 43-23 83-25h69c23 1 39 7 55 24z" fill="#201b17" />
          <path d="M80 26h78v36H48zM170 26h88l45 36H170z" fill="#171715" stroke="#614328" strokeWidth="2" />
          <circle cx="81" cy="88" r="25" fill="#030303" stroke="#332f2a" strokeWidth="8" /><circle cx="290" cy="88" r="25" fill="#030303" stroke="#332f2a" strokeWidth="8" />
          <circle cx="22" cy="64" r="8" fill="#f3be68" /><circle cx="41" cy="64" r="8" fill="#f3be68" /><circle cx="22" cy="64" r="20" fill="#d8832e" opacity=".14" filter="url(#heroGlow)" />
          <path d="M4 67h346" stroke="#433324" strokeWidth="2" opacity=".8" />
        </g>

        <g transform="translate(1060 118)" fill="#080808">
          <circle cx="60" cy="27" r="25" />
          <path d="M32 58c7-21 48-24 63-3l23 96H20z" />
          <path d="m88 79 72 28-8 18-78-20z" />
          <circle cx="154" cy="76" r="17" />
          <path d="M136 96c12-18 38-17 50 1l14 60h-76z" />
          <path d="M28 151h181v13H21z" opacity=".95" />
        </g>

        <g fill="#0c0c0b" opacity=".75">
          <path d="M1180 198h220v40h-220z" /><path d="M1260 162h140v76h-140z" />
        </g>
        <path d="M1010 201c84-19 160-28 286-22" fill="none" stroke="#9a592c" strokeWidth="2" opacity=".25" />
      </svg>

      <div className="hero__brand"><BrandLogo inverse /></div>
      <div className="hero__copy">
        <h1>Найдите своего человека<br />в сообществе</h1>
        <p>Опыт. Поддержка. Рост.</p>
      </div>
    </section>
  );
}
