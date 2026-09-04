const domainKey = (domain: string) => domain.toLowerCase().replace(/[^a-zа-я0-9]+/giu, '-');

export function DomainArtwork({ domain }: { domain: string }) {
  const key = domainKey(domain);
  return (
    <svg className={`domain-art domain-art--${key}`} viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d0d0c" />
          <stop offset="1" stopColor="#3f2a18" />
        </linearGradient>
        <linearGradient id={`sand-${key}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0e0c2" />
          <stop offset="1" stopColor="#c9944f" />
        </linearGradient>
        <radialGradient id={`sun-${key}`} cx="75%" cy="18%" r="60%">
          <stop offset="0" stopColor="#f6c777" stopOpacity=".8" />
          <stop offset="1" stopColor="#f6c777" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={domain === 'Строительство' || domain === 'Продажи' ? `url(#sand-${key})` : `url(#bg-${key})`} />
      <rect width="320" height="180" fill={`url(#sun-${key})`} opacity=".5" />

      {domain === 'IT / AI' && (
        <g fill="none" stroke="#d8a653" strokeWidth="3" strokeLinecap="round" opacity=".94">
          <rect x="116" y="48" width="88" height="78" rx="15" />
          <rect x="140" y="70" width="40" height="34" rx="6" />
          {[58, 78, 98, 118].map((y) => <path key={y} d={`M116 ${y}H80L62 ${y - 12}H36`} />)}
          {[58, 78, 98, 118].map((y) => <path key={`r${y}`} d={`M204 ${y}h36l18 ${12 - y / 20}h28`} />)}
          <circle cx="36" cy="46" r="5" fill="#d8a653" /><circle cx="36" cy="86" r="5" fill="#d8a653" /><circle cx="286" cy="72" r="5" fill="#d8a653" /><circle cx="286" cy="122" r="5" fill="#d8a653" />
        </g>
      )}

      {domain === 'Строительство' && (
        <g fill="none" stroke="#2c251d" strokeWidth="3.2" opacity=".9">
          <path d="M30 141h260" />
          <rect x="52" y="92" width="62" height="49" fill="#8a6238" fillOpacity=".28" />
          <rect x="134" y="70" width="54" height="71" fill="#8a6238" fillOpacity=".22" />
          <rect x="207" y="104" width="50" height="37" fill="#8a6238" fillOpacity=".22" />
          <path d="M92 92V30h6v62M95 34h100M169 34l-38 22M191 34v53" />
          <path d="M218 104V42h6v62M221 46h60M260 46l-28 16" />
          {[64,82,100,118].map((x) => <path key={x} d={`M${x} 101v31`} />)}
        </g>
      )}

      {domain === 'Финансы' && (
        <g>
          {[48, 78, 108, 138, 168, 198].map((x, i) => <rect key={x} x={x} y={128 - i * 13} width="20" height={30 + i * 13} rx="3" fill="#d6a14e" opacity={0.48 + i * 0.07} />)}
          <path d="M44 122 88 103l45 4 45-31 58-24" fill="none" stroke="#f0c475" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m228 47 17 1-7 16" fill="none" stroke="#f0c475" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {domain === 'Продажи' && (
        <g fill="none" stroke="#3c2b1c" strokeWidth="5" opacity=".9">
          <circle cx="126" cy="91" r="58" /><circle cx="126" cy="91" r="38" /><circle cx="126" cy="91" r="18" />
          <path d="M126 91 222 35" />
          <path d="m211 28 25-1-8 23" />
        </g>
      )}

      {domain === 'Маркетинг' && (
        <g transform="translate(45 36)" fill="none" stroke="#d8a653" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 73h42l83-44v92L64 83H22z" fill="#d8a653" fillOpacity=".1" />
          <path d="M61 84 77 133H49L36 84" />
          <path d="M166 48c18 17 18 39 0 56M184 34c31 29 31 67 0 96" opacity=".75" />
        </g>
      )}

      {domain === 'Производство' && (
        <g fill="none" stroke="#d8a653" strokeWidth="5" strokeLinecap="round">
          <circle cx="116" cy="94" r="40" /><circle cx="116" cy="94" r="14" />
          <circle cx="204" cy="83" r="31" /><circle cx="204" cy="83" r="11" />
          {[0,45,90,135,180,225,270,315].map((angle) => <path key={angle} d="M116 44v-15" transform={`rotate(${angle} 116 94)`} />)}
          {[0,60,120,180,240,300].map((angle) => <path key={`b${angle}`} d="M204 45v-13" transform={`rotate(${angle} 204 83)`} />)}
        </g>
      )}

      <g opacity=".14" stroke="#fff" strokeWidth="1">
        <path d="M0 150h320M0 120h320M0 90h320M0 60h320M40 0v180M80 0v180M120 0v180M160 0v180M200 0v180M240 0v180M280 0v180" />
      </g>
    </svg>
  );
}
