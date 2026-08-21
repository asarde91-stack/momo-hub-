'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', variant = 'light', showTagline = false, className = '' }: LogoProps) {
  const terracotta = '#C94F32';
  const fillColor = variant === 'light' ? '#FAEDDD' : '#20201C';

  const sizes = {
    sm: 44,
    md: 64,
    lg: 90,
    xl: 130,
    full: 160,
  };

  const s = sizes[size];

  // Full logo with wordmark
  if (size === 'full') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div style={{ width: s, height: s }}>
          <img src="/logo.svg" alt="Momo Hub Logo" className="w-full h-full object-contain" />
        </div>
        <div className="mt-5 text-center">
          <div
            className="font-body text-xs tracking-[0.4em] uppercase"
            style={{ color: fillColor, opacity: 0.6 }}
          >
            The
          </div>
          <div
            className="font-heading text-5xl font-bold leading-none tracking-wide"
            style={{ color: fillColor }}
          >
            MOMO
          </div>
          <div className="flex items-center gap-4 justify-center mt-1">
            <div className="h-px w-8" style={{ background: terracotta }} />
            <div
              className="font-heading text-xl font-bold tracking-[0.25em]"
              style={{ color: terracotta }}
            >
              HUB
            </div>
            <div className="h-px w-8" style={{ background: terracotta }} />
          </div>
        </div>
        {showTagline && (
          <div className="mt-6 text-center space-y-1">
            <div className="text-xs tracking-[0.25em] font-medium" style={{ color: fillColor, opacity: 0.7 }}>
              MORE MOMOS.
            </div>
            <div className="text-xs tracking-[0.25em] font-medium" style={{ color: fillColor, opacity: 0.7 }}>
              MORE PEOPLE.
            </div>
            <div className="text-xs tracking-[0.25em] font-bold" style={{ color: terracotta }}>
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
        <div style={{ width: s, height: s }}>
          <img src="/logo.svg" alt="Momo Hub Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <div
            className="text-[9px] tracking-[0.35em] uppercase font-body"
            style={{ color: fillColor, opacity: 0.5 }}
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
            <div className="h-px w-3" style={{ background: terracotta }} />
            <div
              className="font-heading text-sm font-bold tracking-[0.15em]"
              style={{ color: terracotta }}
            >
              HUB
            </div>
            <div className="h-px w-3" style={{ background: terracotta }} />
          </div>
        </div>
      </div>
    );
  }

  // Small sizes — icon only
  return (
    <div style={{ width: s, height: s }}>
      <img src="/logo.svg" alt="Momo Hub Logo" className="w-full h-full object-contain" />
    </div>
  );
}
