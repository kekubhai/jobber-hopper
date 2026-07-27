import Link from "next/link";
import type { ReactNode } from "react";

type PrimaryButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "blue" | "dark" | "white" | "white-outline";
  className?: string;
};

const VARIANT_CLASSES: Record<NonNullable<PrimaryButtonProps["variant"]>, string> = {
  blue: "bg-[#1468F5] text-white hover:bg-[#0f56cc] focus-visible:outline-[#0a1633]",
  dark: "bg-[#0a1633] text-white hover:bg-[#1b2b52] focus-visible:outline-[#1468F5]",
  white: "bg-white text-[#1468F5] hover:bg-[#eaf1fe] focus-visible:outline-white",
  "white-outline":
    "border border-[#d7deeb] bg-white text-[#0a1633] hover:border-[#1468F5] hover:text-[#1468F5] focus-visible:outline-[#1468F5]"
};

export function PrimaryButton({ href, children, variant = "blue", className = "" }: PrimaryButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
