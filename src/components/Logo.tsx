'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', variant = 'light', showTagline = false, className = '' }: LogoProps) {
  const cream = '#F5EBDD';
  const terracotta = '#C94F32';
  const charcoal = '#20201C';

  const fillColor = variant === 'light' ? cream : charcoal;
  const hubColor = terracotta;

  const sizes = {
    sm: { icon: 40, scale: 0.5 },
    md: { icon: 56, scale: 0.7 },
    lg: { icon: 80, scale: 1 },
    xl: { icon: 120, scale: 1.5 },
    full: { icon: 100, scale: 1.2 },
  };

  const s = sizes[size];

  // M Icon — exact match from brand
  const MIcon = ({ width }: { width: number }) => (
    <svg width={width} height={width * 1.1} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left leg */}
      <rect x="10" y="8" width="12" height="72" rx="2" fill={fillColor} />
      {/* Right leg */}
      <rect x="78" y="8" width="12" height="72" rx="2" fill={fillColor} />
      {/* V-shape top connecting the legs */}
      <path
        d="M10 8 L50 50 L90 8"
        stroke={fillColor}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Center dome/pinch at V bottom */}
      <ellipse cx="50" cy="52" rx="6" ry="4" fill={fillColor} />
      {/* Pleat lines radiating downward from center */}
      <line x1="50" y1="56" x2="50" y2="95" stroke={fillColor} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="56" x2="32" y2="92" stroke={fillColor} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="56" x2="68" y2="92" stroke={fillColor} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="56" x2="20" y2="85" stroke={fillColor} strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="56" x2="80" y2="85" stroke={fillColor} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );

  // Full logo with wordmark
  if (size === 'full') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <MIcon width={s.icon} />
        <div className="mt-4 text-center">
          <div
            className="font-body text-xs tracking-[0.35em] uppercase"
            style={{ color: fillColor, opacity: 0.7 }}
          >
            The
          </div>
          <div
            className="font-heading text-4xl font-bold leading-none tracking-wide"
            style={{ color: fillColor }}
          >
            MOMO
          </div>
          <div className="flex items-center gap-3 justify-center mt-0.5">
            <div className="h-px w-6" style={{ background: hubColor }} />
            <div
              className="font-heading text-xl font-bold tracking-[0.2em]"
              style={{ color: hubColor }}
            >
              HUB
            </div>
            <div className="h-px w-6" style={{ background: hubColor }} />
          </div>
        </div>
        {showTagline && (
          <div className="mt-5 text-center space-y-0.5">
            <div className="text-xs tracking-[0.2em] font-medium" style={{ color: fillColor }}>
              MORE MOMOS.
            </div>
            <div className="text-xs tracking-[0.2em] font-medium" style={{ color: fillColor }}>
              MORE PEOPLE.
            </div>
            <div className="text-xs tracking-[0.2em] font-bold" style={{ color: hubColor }}>
              MORE MEMORIES.
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact logo for headers (icon + wordmark inline)
  if (size === 'lg' || size === 'xl') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <MIcon width={s.icon} />
        <div className="flex flex-col">
          <div
            className="text-[9px] tracking-[0.3em] uppercase font-body"
            style={{ color: fillColor, opacity: 0.6 }}
          >
            The
          </div>
          <div
            className="font-heading text-2xl font-bold leading-none tracking-wide"
            style={{ color: fillColor }}
          >
            MOMO
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-px w-3" style={{ background: hubColor }} />
            <div
              className="font-heading text-sm font-bold tracking-[0.15em]"
              style={{ color: hubColor }}
            >
              HUB
            </div>
            <div className="h-px w-3" style={{ background: hubColor }} />
          </div>
        </div>
      </div>
    );
  }

  // Small sizes — icon only
  return <MIcon width={s.icon} />;
}
