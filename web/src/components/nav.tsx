"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/children", label: "Children" },
  { href: "/generate", label: "Generate" },
  { href: "/compass", label: "Compass" },
  { href: "/archetypes", label: "Archetypes" },
  { href: "/calendar", label: "Calendar" },
  { href: "/lessons", label: "Lessons" },
  { href: "/standards", label: "Standards" },
  { href: "/explore", label: "Explore" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      background: 'rgba(249,246,239,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
    }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Wordmark */}
          <Link
            href="/"
            className="font-cormorant-sc tracking-wide text-lg"
            style={{ color: 'var(--night)', letterSpacing: '0.06em' }}
          >
            The Sage&rsquo;s Compass
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-0.5 items-center">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{
                    color: active ? 'var(--night)' : 'var(--text-secondary)',
                    background: active ? 'rgba(110,110,158,0.1)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden px-4 py-2 space-y-0.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm"
                style={{
                  color: active ? 'var(--night)' : 'var(--text-secondary)',
                  background: active ? 'rgba(110,110,158,0.1)' : 'transparent',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
