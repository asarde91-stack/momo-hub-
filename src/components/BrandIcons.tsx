'use client';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Leaf icon for Veg
export function VegIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.36-6 9-8 .63-2 1-4 1-6 0-2-1-4-1-4s-1 2-1 4" />
      <path d="M12 6c-2 0-4 2-4 4" />
    </svg>
  );
}

// Chicken icon
export function ChickenIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
      <path d="M8 14c-2.5 0-4 1.5-4 3v1h16v-1c0-1.5-1.5-3-4-3" />
      <path d="M10 14v3" />
      <path d="M14 14v3" />
      <circle cx="18" cy="5" r="1.5" fill={color} stroke="none" />
      <path d="M19 4l1.5-1" />
    </svg>
  );
}

// Diamond icon for Paneer
export function PaneerIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L22 12L12 22L2 12Z" />
      <path d="M12 8L16 12L12 16L8 12Z" />
    </svg>
  );
}

// Star icon for Bestseller
export function BestsellerIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// Chili icon for Spicy
export function SpicyIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2c0 0-1 2-1 4 0 1.5.5 2 1 2s1-.5 1-2c0-2-1-4-1-4z" />
      <path d="M10 8c-3 0-5 3-5 6 0 4 3 7 5 8" />
      <path d="M14 8c3 0 5 3 5 6 0 4-3 7-5 8" />
      <path d="M10 14h4" />
    </svg>
  );
}

// New badge
export function NewIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color} stroke="none" fontFamily="Poppins, sans-serif">NEW</text>
    </svg>
  );
}

// Combo icon (bag with plus)
export function ComboIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </svg>
  );
}

// Takeaway icon (bag)
export function TakeawayIcon({ size = 24, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

// Helper to get icon by category
export function getCategoryIcon(category: string, size?: number, color?: string) {
  switch (category) {
    case 'veg': return <VegIcon size={size} color={color} />;
    case 'non-veg': return <ChickenIcon size={size} color={color} />;
    case 'paneer': return <PaneerIcon size={size} color={color} />;
    case 'bestseller': return <BestsellerIcon size={size} color={color} />;
    case 'spicy': return <SpicyIcon size={size} color={color} />;
    case 'new': return <NewIcon size={size} color={color} />;
    case 'combo': return <ComboIcon size={size} color={color} />;
    case 'takeaway': return <TakeawayIcon size={size} color={color} />;
    default: return <VegIcon size={size} color={color} />;
  }
}
