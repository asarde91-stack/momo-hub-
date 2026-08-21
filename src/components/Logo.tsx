'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'full';
  className?: string;
}

export default function Logo({ size = 'md', variant = 'light', className = '' }: LogoProps) {
  const sizes = {
    sm: { width: 32, height: 32, text: 'text-xs' },
    md: { width: 40, height: 40, text: 'text-sm' },
    lg: { width: 56, height: 56, text: 'text-base' },
    xl: { width: 80, height: 80, text: 'text-xl' },
  };

  const s = sizes[size];
  const fillColor = variant === 'light' ? '#F5EBDD' : '#C94F32';
  const textColor = variant === 'light' ? '#F5EBDD' : '#20201C';
  const subTextColor = variant === 'light' ? '#DBB98A' : '#C94F32';

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        {/* Icon Mark */}
        <svg width={s.width} height={s.height} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pleated M shape — inspired by momo folds */}
          <path
            d="M40 8 L20 30 L12 42 L20 42 L28 32 L32 42 L24 56 L16 68 L24 68 L32 58 L40 42 L48 58 L56 68 L64 68 L56 56 L48 42 L52 32 L60 42 L68 42 L60 30 Z"
            fill={fillColor}
            stroke={fillColor}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        {/* Wordmark */}
        <div className="mt-2 text-center">
          <div className="text-[10px] font-body tracking-[0.3em] text-charcoal/60 uppercase">The</div>
          <div className="font-heading text-charcoal text-lg font-bold leading-none tracking-wide">MOMO</div>
          <div className="flex items-center gap-2 justify-center">
            <div className="h-px w-4 bg-terracotta" />
            <div className="font-heading text-terracotta text-sm font-bold tracking-widest">HUB</div>
            <div className="h-px w-4 bg-terracotta" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <svg width={s.width} height={s.height} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M40 8 L20 30 L12 42 L20 42 L28 32 L32 42 L24 56 L16 68 L24 68 L32 58 L40 42 L48 58 L56 68 L64 68 L56 56 L48 42 L52 32 L60 42 L68 42 L60 30 Z"
        fill={fillColor}
        stroke={fillColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
