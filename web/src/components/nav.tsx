"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { track } from "@/lib/analytics";

// Flat nav — the old "Planner" dropdown (Dashboard · Lessons · Standards) added
// friction without hiding complexity. /lessons now redirects into /dashboard
// (now labeled "Home"), and Standards is first-class.
const signedInNavItems = [
  { href: "/dashboard", label: "Home"      },
  { href: "/standards", label: "Standards" },
  { href: "/account",   label: "Account"   },
];

const publicNavItems = [
  { href: "/compass",    label: "Compass"    },
  { href: "/archetypes", label: "Archetypes" },
  { href: "/explore",    label: "Explore"    },
  { href: "/about",      label: "About"      },
  { href: "/contact",    label: "Contact"    },
];

const TIER_CACHE_KEY = "nav_tier_cache_v1";

/**
 * Read tier for the signed-in user. Uses a localStorage cache for instant
 * render (avoids button flash on every navigation) and refreshes in the
 * background. Returns `null` while we genuinely don't know the tier yet.
 */
function useUserTier(isSignedIn: boolean | undefined) {
  const [tier, setTier] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(TIER_CACHE_KEY); } catch { return null; }
  });

  useEffect(() => {
    if (!isSignedIn) {
      setTier(null);
      try { localStorage.removeItem(TIER_CACHE_KEY); } catch { /* ignore */ }
      return;
    }
    fetch("/api/user/tier")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.tier) return;
        setTier(data.tier);
        try { localStorage.setItem(TIER_CACHE_KEY, data.tier); } catch { /* ignore */ }
      })
      .catch(() => { /* keep cached value */ });
  }, [isSignedIn]);

  return tier;
}


export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();
  const tier = useUserTier(isSignedIn);

  // Pricing shown to signed-out users; signed-in free-tier users get the
  // gold "Upgrade" CTA instead. Paid tiers see neither.
  const showPricingLink = isSignedIn === false;
  const showUpgradeCta = isSignedIn === true && tier === "compass";

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
                {/* Create — funnel primary, left-anchored */}
                <Link href="/create" className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                  style={navLinkStyle(pathname.startsWith('/create'))}>
                  Create
                </Link>

                {signedInNavItems.map((item) => (
                  <Link key={item.href} href={item.href}
                    className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                    style={navLinkStyle(pathname.startsWith(item.href))}>
                    {item.label}
                  </Link>
                ))}
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

            {showPricingLink && (
              <Link
                href="/pricing"
                onClick={() => track("nav_pricing_clicked", { placement: "desktop" })}
                className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                style={navLinkStyle(pathname.startsWith("/pricing"))}
              >
                Pricing
              </Link>
            )}

            <SocialIcons />

            {showUpgradeCta && (
              <Link
                href="/pricing"
                onClick={() => track("nav_upgrade_clicked", { placement: "desktop", tier })}
                className="px-2.5 py-1.5 rounded-lg text-sm transition-colors shrink-0 ml-1 hover:bg-black/[0.04]"
                style={{
                  color: "#B08A2E",
                  fontWeight: 500,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                title="Upgrade for more lessons and children"
              >
                Upgrade
              </Link>
            )}

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
              {signedInNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm"
                  style={navLinkStyle(pathname.startsWith(item.href))}>
                  {item.label}
                </Link>
              ))}
            </>
          )}
          {publicNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm"
              style={navLinkStyle(pathname.startsWith(item.href))}>
              {item.label}
            </Link>
          ))}
          {showPricingLink && (
            <Link
              href="/pricing"
              onClick={() => { track("nav_pricing_clicked", { placement: "mobile" }); setMobileOpen(false); }}
              className="block px-3 py-2 rounded-lg text-sm"
              style={navLinkStyle(pathname.startsWith("/pricing"))}
            >
              Pricing
            </Link>
          )}
          {showUpgradeCta && (
            <Link
              href="/pricing"
              onClick={() => { track("nav_upgrade_clicked", { placement: "mobile", tier }); setMobileOpen(false); }}
              className="block px-3 py-2 rounded-lg text-sm"
              style={{
                color: "#B08A2E",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Upgrade
            </Link>
          )}
          <div className="px-3 py-2 flex items-center justify-between">
            {isSignedIn ? <UserButton /> : (
              <SignInButton mode="redirect">
                <button className="px-3 py-1.5 rounded-lg text-sm"
                  style={{ background: 'var(--night)', color: '#F9F6EF', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Sign In
                </button>
              </SignInButton>
            )}
            <SocialIcons />
          </div>
        </div>
      )}
    </nav>
  );
}

function SocialIcons() {
  return (
    <div className="flex items-center" style={{ gap: "0.6rem", marginLeft: "0.5rem" }}>
      <a href="https://www.instagram.com/sages_compass/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon-nav">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      </a>
      <a href="https://www.facebook.com/profile.php?id=61576395340974" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon-nav">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      </a>
    </div>
  );
}
