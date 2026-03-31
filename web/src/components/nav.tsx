"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";

const plannerItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lessons",   label: "Lessons"   },
  { href: "/calendar",  label: "Calendar"  },
  { href: "/standards", label: "Standards" },
];

const publicNavItems = [
  { href: "/compass",    label: "Compass"    },
  { href: "/archetypes", label: "Archetypes" },
  { href: "/explore",    label: "Explore"    },
  { href: "/about",      label: "About"      },
  { href: "/contact",    label: "Contact"    },
];


export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const plannerRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();

  const plannerActive = plannerItems.some((i) => pathname.startsWith(i.href));

  // Close planner dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (plannerRef.current && !plannerRef.current.contains(e.target as Node)) {
        setPlannerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    color: active ? 'var(--night)' : 'var(--text-secondary)',
    background: active ? 'rgba(110,110,158,0.1)' : 'transparent',
    fontWeight: active ? 500 : 400,
    whiteSpace: 'nowrap' as const,
  });

  return (
    <nav style={{
      background: 'rgba(249,246,239,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      position: 'relative',
      zIndex: 50,
    }}>
      <div className="mx-auto px-4" style={{ maxWidth: "90rem" }}>
        <div className="flex items-center justify-between h-14">

          {/* Wordmark */}
          <Link href="/" className="font-cormorant-sc tracking-wide text-lg shrink-0"
            style={{ color: 'var(--night)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            The Sage&rsquo;s Compass
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center" style={{ gap: "2px" }}>

            {isSignedIn && (
              <>
                {/* Create */}
                <Link href="/create" className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                  style={navLinkStyle(pathname.startsWith('/create'))}>
                  Create
                </Link>

                {/* Planner dropdown */}
                <div ref={plannerRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setPlannerOpen((v) => !v)}
                    className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                    style={{
                      ...navLinkStyle(plannerActive),
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    Planner
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ opacity: 0.5, transition: 'transform 0.15s', transform: plannerOpen ? 'rotate(180deg)' : 'none' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {plannerOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(249,246,239,0.97)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      padding: '0.4rem',
                      minWidth: '160px',
                      zIndex: 100,
                    }}>
                      {plannerItems.map((item) => {
                        const active = pathname.startsWith(item.href);
                        return (
                          <Link key={item.href} href={item.href}
                            onClick={() => setPlannerOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm transition-colors"
                            style={navLinkStyle(active)}>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Account */}
                <Link href="/account" className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                  style={navLinkStyle(pathname.startsWith('/account'))}>
                  Account
                </Link>
              </>
            )}

            {/* Public items */}
            {publicNavItems.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                style={navLinkStyle(pathname.startsWith(item.href))}>
                {item.label}
              </Link>
            ))}

            <div className="ml-2 shrink-0">
              {isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="redirect">
                  <button className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{ background: 'var(--night)', color: '#F9F6EF', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-secondary)' }} aria-label="Toggle menu">
            {mobileOpen
              ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden px-4 py-2 space-y-0.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {isSignedIn && (
            <>
              <Link href="/create" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm"
                style={navLinkStyle(pathname.startsWith('/create'))}>Create</Link>
              {/* Planner group */}
              <div style={{ paddingLeft: '0.75rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '0.5rem 0.75rem 0.25rem' }}>
                  Planner
                </p>
                {plannerItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm"
                    style={navLinkStyle(pathname.startsWith(item.href))}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link href="/account" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm"
                style={navLinkStyle(pathname.startsWith('/account'))}>Account</Link>
            </>
          )}
          {publicNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm"
              style={navLinkStyle(pathname.startsWith(item.href))}>
              {item.label}
            </Link>
          ))}
          <div className="px-3 py-2">
            {isSignedIn ? <UserButton /> : (
              <SignInButton mode="redirect">
                <button className="px-3 py-1.5 rounded-lg text-sm"
                  style={{ background: 'var(--night)', color: '#F9F6EF', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
