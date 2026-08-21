'use client';

interface PatternProps {
  variant?: 'divider' | 'background' | 'corner';
  color?: string;
  className?: string;
}

export default function Pattern({ variant = 'divider', color = '#C94F32', className = '' }: PatternProps) {
  if (variant === 'divider') {
    return (
      <div className={`w-full flex justify-center py-3 ${className}`}>
        <svg width="120" height="20" viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Momo fold pleats — horizontal line */}
          <path d="M0 10 L10 4 L20 10 L30 4 L40 10 L50 4 L60 10 L70 4 L80 10 L90 4 L100 10 L110 4 L120 10" 
            stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
          <path d="M0 10 L10 16 L20 10 L30 16 L40 10 L50 16 L60 10 L70 16 L80 10 L90 16 L100 10 L110 16 L120 10" 
            stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.15" />
        </svg>
      </div>
    );
  }

  if (variant === 'background') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] ${className}`}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          {/* Repeating momo fold pattern */}
          <defs>
            <pattern id="momo-fold" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 0 L10 15 L0 30 L10 30 L20 15 L30 30 L40 30 L30 15 Z" 
                fill={color} fillOpacity="0.5" />
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#momo-fold)" />
        </svg>
      </div>
    );
  }

  if (variant === 'corner') {
    return (
      <div className={`absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none opacity-10 ${className}`}>
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M96 0 L60 0 L96 36 Z" fill={color} />
          <path d="M96 0 L72 0 L96 24 Z" fill={color} opacity="0.5" />
          <path d="M48 0 L96 48 L96 0 Z" fill={color} opacity="0.2" />
        </svg>
      </div>
    );
  }

  return null;
}
