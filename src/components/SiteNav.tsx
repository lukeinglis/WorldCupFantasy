"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./AuthProvider";

interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  {
    href: "/groups",
    label: "Groups",
    children: [
      { href: "/groups", label: "Standings" },
      { href: "/groups?tab=picks", label: "Picks" },
      { href: "/groups?tab=schedule", label: "Schedule" },
      { href: "/groups?tab=knockout", label: "Knockout" },
    ],
  },
  { href: "/rules", label: "Rules" },
];

function isActive(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  const base = href.split("?")[0];
  return currentPath === base || currentPath.startsWith(`${base}/`);
}

export default function SiteNav() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const showAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting UI state on route change (external navigation event)
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting UI state on route change (external navigation event)
    setDropdownOpen(false);
  }, [pathname]);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen, closeDropdown]);

  function handleDropdownKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      closeDropdown();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 backdrop-blur supports-[backdrop-filter]:bg-navy/80 shadow-lg shadow-black/20 relative">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-accent hover:text-green-300 transition-colors"
        >
          <span aria-hidden className="text-2xl">⚽</span>
          <span className="font-heading font-bold uppercase tracking-wide text-base sm:text-lg">
            World Cup <span className="text-gold">2026</span> Fantasy
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            if (item.children) {
              return (
                <div key={item.href} className="relative" ref={dropdownRef} onKeyDown={handleDropdownKeyDown}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-controls="groups-dropdown"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1 ${
                      active
                        ? "bg-pitch text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-accent"
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <ul
                      id="groups-dropdown"
                      className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-white/10 bg-navy shadow-xl shadow-black/30 py-1 z-50"
                    >
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-accent transition-colors"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-pitch text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Auth actions */}
          {user ? (
            <>
              <Link
                href="/my-picks"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(pathname, "/my-picks")
                    ? "bg-pitch text-white"
                    : "text-accent hover:bg-accent/10"
                }`}
              >
                My Picks
              </Link>
              {showAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(pathname, "/admin")
                      ? "bg-pitch text-white"
                      : "text-gold hover:bg-gold/10"
                  }`}
                >
                  Admin
                </Link>
              )}
              <span className="text-xs text-gray-500 px-1">{user.name}</span>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/join"
              className="ml-1 px-4 py-2 rounded-md text-sm font-bold bg-accent text-navy hover:bg-green-300 transition-colors"
            >
              Join
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-accent hover:bg-white/5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="lg:hidden border-t border-white/10 bg-navy"
        >
          <ul className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);

              if (item.children) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? "bg-pitch text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-accent"
                      }`}
                    >
                      {item.label}
                    </Link>
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-3 py-1.5 rounded-md text-sm text-gray-400 hover:bg-white/5 hover:text-accent transition-colors"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-pitch text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-accent"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            {/* Mobile auth items */}
            <li className="border-t border-white/10 mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/my-picks"
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(pathname, "/my-picks")
                        ? "bg-pitch text-white"
                        : "text-accent hover:bg-accent/10"
                    }`}
                  >
                    My Picks
                  </Link>
                  {showAdmin && (
                    <Link
                      href="/admin"
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(pathname, "/admin")
                          ? "bg-pitch text-white"
                          : "text-gold hover:bg-gold/10"
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Logout ({user.name})
                  </button>
                </>
              ) : (
                <Link
                  href="/join"
                  className="block px-3 py-2 mt-1 rounded-md text-sm font-bold bg-accent text-navy text-center hover:bg-green-300 transition-colors"
                >
                  Join the League
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden />
    </header>
  );
}
