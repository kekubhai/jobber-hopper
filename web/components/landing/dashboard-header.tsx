"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { BRAND_NAME, BRAND_WORDMARK } from "@/lib/landing-data";

const DASHBOARD_NAV = [
  { label: "Profile", href: "#profile" },
  { label: "Applications", href: "#applications" },
  { label: "Analytics", href: "#analytics" }
] as const;

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1468F5] ${className}`}
      aria-hidden
    >
      <Zap size={20} strokeWidth={2.5} fill="currentColor" />
    </span>
  );
}

/**
 * Landing-styled header for the dashboard. Solid blue, brand mark on the left,
 * section anchors in the middle, Clerk sign-in / user button on the right.
 *
 * No "Sign in" lives in the dashboard body anymore — it's all here.
 */
export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#1160e4] shadow-lg shadow-[#0a1633]/10">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label={`${BRAND_NAME} dashboard`}
        >
          <LogoMark />
          <span className="whitespace-nowrap text-xl font-extrabold lowercase tracking-tight text-white">
            {BRAND_WORDMARK}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Dashboard">
          {DASHBOARD_NAV.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full text-sm font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1468F5] transition-colors hover:bg-[#eaf1fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          aria-expanded={menuOpen}
          aria-controls="dashboard-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="dashboard-mobile-menu"
          aria-label="Mobile"
          className="border-t border-white/15 bg-[#1160e4] px-5 pb-6 pt-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {DASHBOARD_NAV.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-[#1468F5]"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="rounded-full bg-white px-5 py-3">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
