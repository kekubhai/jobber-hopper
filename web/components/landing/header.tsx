"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, Zap } from "lucide-react";
import { BRAND_NAME, BRAND_WORDMARK, NAV_LINKS } from "@/lib/landing-data";

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

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-[#1160e4]/95 shadow-lg shadow-[#0a1633]/10 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link
          href="#top"
          className="flex items-center gap-2.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label={`${BRAND_NAME} home`}
        >
          <LogoMark />
          <span className="whitespace-nowrap text-xl font-extrabold lowercase tracking-tight text-white">
            {BRAND_WORDMARK}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-1 rounded-full text-sm font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {link.label}
              {link.hasChevron ? <ChevronDown size={16} aria-hidden /> : null}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1468F5] transition-colors hover:bg-[#eaf1fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Get the Extension
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-white/15 bg-[#1160e4]/98 px-5 pb-6 pt-3 backdrop-blur md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
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
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-[#1468F5]"
              >
                Get the Extension
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
