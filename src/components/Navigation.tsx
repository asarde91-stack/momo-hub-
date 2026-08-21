'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Orders', icon: '🛒' },
  { href: '/menu', label: 'Menu', icon: '📝' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <span className={`text-2xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[10px] mt-0.5 leading-tight font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
