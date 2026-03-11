"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/children", label: "Children" },
  { href: "/generate", label: "Generate Lesson" },
  { href: "/calendar", label: "Calendar" },
  { href: "/lessons", label: "Lessons" },
  { href: "/standards", label: "Standards" },
];

export function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            EduApp
          </Link>
          <div className="flex gap-1 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm ${
                  pathname.startsWith(item.href)
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggle}
              className="ml-2 p-2 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
