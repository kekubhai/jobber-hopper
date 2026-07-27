import Link from "next/link";
import { AtSign, Globe, Mail, Zap } from "lucide-react";
import { BRAND_WORDMARK, CONTACT_EMAIL, FOOTER_COLUMNS } from "@/lib/landing-data";

const SOCIAL_LINKS = [
  { label: "Follow us on X", href: "https://x.com", icon: AtSign },
  { label: "Visit our website", href: "#top", icon: Globe },
  { label: "Email us", href: `mailto:${CONTACT_EMAIL}`, icon: Mail }
];

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#0a1633]">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="rounded text-sm text-[#5b6478] transition-colors hover:text-[#1468F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1468F5]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex items-end gap-4 border-b border-[#e6eaf2] pb-10" aria-hidden>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1468F5] text-white sm:h-20 sm:w-20">
            <Zap size={40} strokeWidth={2.5} fill="currentColor" />
          </span>
          <span className="text-[clamp(2rem,9vw,7rem)] font-extrabold lowercase leading-none tracking-tighter text-[#0a1633]">
            {BRAND_WORDMARK}
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <ul className="flex items-center gap-3" aria-label="Social links">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6eaf2] text-[#5b6478] transition-colors hover:border-[#1468F5] hover:text-[#1468F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1468F5]"
                >
                  <Icon size={18} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-6 text-sm text-[#5b6478]">
            <Link
              href="#faq"
              className="rounded transition-colors hover:text-[#1468F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1468F5]"
            >
              Terms of use
            </Link>
            <span>{BRAND_WORDMARK} © 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
