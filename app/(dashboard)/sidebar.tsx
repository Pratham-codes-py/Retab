'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../(auth)/actions';

const ALL_NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: 'dashboard' },
  { href: '/menu',       label: 'Menu',        icon: 'restaurant_menu' },
  { href: '/billing',    label: 'Billing',     icon: 'payments' },
  { href: '/customers',  label: 'Customers',   icon: 'groups' },
  { href: '/reviews',    label: 'Reviews',     icon: 'reviews' },
  { href: '/analytics',  label: 'Analytics',   icon: 'analytics' },
  { href: '/settings',   label: 'Settings',    icon: 'settings' },
] as const;

const STAFF_NAV_ITEMS = ALL_NAV_ITEMS.filter(item =>
  ['/dashboard', '/billing', '/menu', '/customers', '/reviews'].includes(item.href)
);

export default function Sidebar({
  role,
  currentCafeId,
}: {
  role: 'owner' | 'staff';
  currentCafeId?: string;
}) {
  const currentPath = usePathname() || '/dashboard';
  const navItems = role === 'owner' ? ALL_NAV_ITEMS : STAFF_NAV_ITEMS;

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '256px',
        height: '100vh',
        background: '#f6f3f2',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        zIndex: 40,
        boxShadow: '1px 0 0 #dbc1bb',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Brand */}
        <div style={{ padding: '0 8px' }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: '#853423',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            Retab
          </h1>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: '#576158',
            opacity: 0.7,
            marginTop: '2px',
          }}>
            Hospitality SaaS
          </p>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => {
            const isActive = currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: isActive ? '#a44b38' : 'transparent',
                  color: isActive ? '#ffddd6' : '#576158',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.01em',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease, transform 0.1s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div>
        <form action={logout}>
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 8px',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              color: '#576158',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
