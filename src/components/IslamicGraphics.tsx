import React from 'react';

export const MadrasahLogo: React.FC<{ className?: string; logoUrl?: string }> = ({
  className = 'w-12 h-12',
  logoUrl,
}) => {
  if (logoUrl && logoUrl.trim().length > 0) {
    return (
      <div
        className={`${className} rounded-full overflow-hidden border-2 border-[#D4AF37] bg-white flex items-center justify-center shrink-0`}
      >
        <img
          src={logoUrl}
          alt="Meder Dhar Shishu Madrasah Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className={`${className} shrink-0`}
      aria-label="Meder Dhar Shishu Madrasah Seal"
    >
      <defs>
        <linearGradient id="mdsmGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6DC88" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A97C10" />
        </linearGradient>
        <linearGradient id="mdsmNavy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123466" />
          <stop offset="100%" stopColor="#071426" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="#FFFFFF" stroke="url(#mdsmGold)" strokeWidth="4" />
      <circle cx="60" cy="60" r="50" fill="url(#mdsmNavy)" stroke="url(#mdsmGold)" strokeWidth="2" />
      <circle
        cx="60"
        cy="60"
        r="43"
        fill="none"
        stroke="url(#mdsmGold)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {/* Islamic 8-point Rub el Hizb */}
      <rect
        x="38"
        y="38"
        width="44"
        height="44"
        fill="none"
        stroke="url(#mdsmGold)"
        strokeWidth="1.6"
        opacity="0.45"
      />
      <rect
        x="38"
        y="38"
        width="44"
        height="44"
        transform="rotate(45 60 60)"
        fill="none"
        stroke="url(#mdsmGold)"
        strokeWidth="1.6"
        opacity="0.45"
      />
      {/* Mosque Arch & Open Book */}
      <path d="M44 65 Q60 36 76 65 Z" fill="url(#mdsmGold)" opacity="0.2" />
      <path
        d="M40 72 L60 80 L80 72 L80 56 L60 64 L40 56 Z"
        fill="none"
        stroke="url(#mdsmGold)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line x1="60" y1="64" x2="60" y2="80" stroke="url(#mdsmGold)" strokeWidth="2" />
      {/* Crescent */}
      <path
        d="M63 29 A9 9 0 1 0 71 41 A7 7 0 1 1 63 29 Z"
        fill="url(#mdsmGold)"
      />
    </svg>
  );
};

export const IslamicPatternBackground: React.FC<{ className?: string; opacity?: number }> = ({
  className = '',
  opacity = 0.08,
}) => (
  <svg
    className={`pointer-events-none select-none ${className}`}
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <pattern id="islamicGeoPattern" width="80" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#D4AF37" strokeWidth="0.9" opacity={opacity}>
          <rect x="20" y="20" width="40" height="40" />
          <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
          <circle cx="40" cy="40" r="10" />
          <path d="M0 40 L20 20 M60 20 L80 40 M80 40 L60 60 M20 60 L0 40" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamicGeoPattern)" />
  </svg>
);

export const MosqueHeroArtwork: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 560 440"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Islamic Madrasah Architecture Illustration"
  >
    <defs>
      <linearGradient id="heroDomeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1B4684" />
        <stop offset="100%" stopColor="#091930" />
      </linearGradient>
      <linearGradient id="heroGoldLine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F5DA82" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#A27912" />
      </linearGradient>
      <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F5DA82" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Outer Arch Frame */}
    <rect
      x="18"
      y="18"
      width="524"
      height="404"
      rx="24"
      fill="#0B1E3B"
      stroke="url(#heroGoldLine)"
      strokeWidth="1.5"
      strokeOpacity="0.45"
    />

    {/* Soft Radiance Behind Dome */}
    <circle cx="280" cy="185" r="145" fill="url(#lanternGlow)" />

    {/* Crescent & Stars */}
    <path d="M430 66 A22 22 0 1 0 452 94 A17 17 0 1 1 430 66 Z" fill="url(#heroGoldLine)" />
    <polygon points="116,74 120,84 130,84 122,90 125,100 116,94 107,100 110,90 102,84 112,84" fill="#D4AF37" opacity="0.7" />
    <polygon points="376,92 379,98 385,98 380,102 382,108 376,104 370,108 372,102 367,98 373,98" fill="#D4AF37" opacity="0.55" />

    {/* Left & Right Minarets */}
    <g stroke="url(#heroGoldLine)" strokeWidth="1.5" fill="url(#heroDomeGrad)">
      <rect x="92" y="155" width="28" height="215" rx="3" />
      <path d="M88 155 Q106 112 124 155 Z" />
      <line x1="106" y1="126" x2="106" y2="105" />
      <circle cx="106" cy="102" r="4" fill="#D4AF37" />
      <rect x="85" y="218" width="42" height="10" rx="2" fill="#14376A" />

      <rect x="440" y="155" width="28" height="215" rx="3" />
      <path d="M436 155 Q454 112 472 155 Z" />
      <line x1="454" y1="126" x2="454" y2="105" />
      <circle cx="454" cy="102" r="4" fill="#D4AF37" />
      <rect x="433" y="218" width="42" height="10" rx="2" fill="#14376A" />
    </g>

    {/* Central Grand Dome */}
    <path
      d="M172 225 C172 128 280 102 280 78 C280 102 388 128 388 225 Z"
      fill="url(#heroDomeGrad)"
      stroke="url(#heroGoldLine)"
      strokeWidth="2"
    />
    <line x1="280" y1="78" x2="280" y2="54" stroke="url(#heroGoldLine)" strokeWidth="2.5" />
    <circle cx="280" cy="50" r="5" fill="#D4AF37" />

    {/* Side Small Domes */}
    <path
      d="M132 238 C132 195 168 184 168 172 C168 184 204 195 204 238 Z"
      fill="#102C55"
      stroke="url(#heroGoldLine)"
      strokeWidth="1.5"
    />
    <path
      d="M356 238 C356 195 392 184 392 172 C392 184 428 195 428 238 Z"
      fill="#102C55"
      stroke="url(#heroGoldLine)"
      strokeWidth="1.5"
    />

    {/* Facade & Pointed Islamic Archways */}
    <rect
      x="126"
      y="236"
      width="308"
      height="134"
      rx="4"
      fill="#0D2344"
      stroke="url(#heroGoldLine)"
      strokeWidth="1.5"
    />
    {/* Central Arch */}
    <path
      d="M236 370 L236 292 C236 266 280 250 280 250 C280 250 324 266 324 292 L324 370 Z"
      fill="#061224"
      stroke="url(#heroGoldLine)"
      strokeWidth="2"
    />
    {/* Hanging Lantern inside Central Arch */}
    <line x1="280" y1="250" x2="280" y2="284" stroke="#D4AF37" strokeWidth="1.5" />
    <polygon points="272,284 288,284 292,302 280,312 268,302" fill="#F5DA82" opacity="0.88" />
    {/* Flanking Arches */}
    <path
      d="M156 370 L156 310 C156 290 184 280 184 280 C184 280 212 290 212 310 L212 370 Z"
      fill="#07162B"
      stroke="url(#heroGoldLine)"
      strokeWidth="1.5"
      opacity="0.85"
    />
    <path
      d="M348 370 L348 310 C348 290 376 280 376 280 C376 280 404 290 404 310 L404 370 Z"
      fill="#07162B"
      stroke="url(#heroGoldLine)"
      strokeWidth="1.5"
      opacity="0.85"
    />

    {/* Open Quran / Book Pedestal in Foreground */}
    <path
      d="M225 385 L280 398 L335 385 L335 358 L280 371 L225 358 Z"
      fill="#123466"
      stroke="#F2D06B"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <line x1="280" y1="371" x2="280" y2="398" stroke="#F2D06B" strokeWidth="2" />
    <line x1="70" y1="370" x2="490" y2="370" stroke="url(#heroGoldLine)" strokeWidth="2" />
  </svg>
);

export const ScholarAvatar: React.FC<{
  photoUrl?: string;
  name: string;
  className?: string;
}> = ({ photoUrl, name, className = 'w-20 h-20' }) => {
  const [imgErr, setImgErr] = React.useState(false);

  React.useEffect(() => {
    setImgErr(false);
  }, [photoUrl]);

  if (photoUrl && photoUrl.trim().length > 0 && !imgErr) {
    return (
      <img
        src={photoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgErr(true)}
        className={`${className} object-cover rounded-xl border border-[#D4AF37]/60 bg-[#0E2240] shrink-0`}
      />
    );
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`${className} rounded-xl border border-[#D4AF37]/60 bg-gradient-to-br from-[#123466] to-[#071426] flex items-center justify-center text-[#F2D06B] font-display font-bold text-lg shrink-0`}
    >
      {initials || 'MS'}
    </div>
  );
};

export const OfficialResultSeal: React.FC<{ label?: string }> = ({
  label = 'OFFICIAL RESULT',
}) => (
  <div className="relative w-20 h-20 flex items-center justify-center -rotate-12 select-none shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#F2C94C"
        strokeWidth="3"
        strokeDasharray="5 4"
      />
      <circle
        cx="50"
        cy="50"
        r="35"
        fill="rgba(242, 201, 76, 0.08)"
        stroke="#F2C94C"
        strokeWidth="1.2"
      />
    </svg>
    <span className="absolute text-center text-[10px] font-extrabold tracking-wider text-[#F2C94C] leading-tight px-2 uppercase">
      {label}
    </span>
  </div>
);

export const MadrasahLoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Loading Meder Dhar Shishu Madrasah...',
}) => (
  <div className="min-h-screen bg-[#061224] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <IslamicPatternBackground opacity={0.07} />
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="p-2 rounded-full border border-[#D4AF37]/50 bg-[#0D213F] shadow-2xl mb-5">
        <MadrasahLogo className="w-20 h-20" />
      </div>
      <h1 className="font-display text-xl md:text-2xl font-bold tracking-wide text-[#F2D06B]">
        MEDER DHAR SHISHU MADRASAH
      </h1>
      <p className="mt-2 text-xs text-slate-300 tracking-wider uppercase">{message}</p>
      <div className="mt-5 w-48 h-1 bg-[#123466] rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-[#D4AF37] to-[#F6DC88] animate-pulse rounded-full" />
      </div>
    </div>
  </div>
);
