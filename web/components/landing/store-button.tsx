import Link from "next/link";
import { LayoutDashboard, Puzzle } from "lucide-react";

type StoreButtonProps = {
  store: "chrome" | "web";
  href?: string;
  tone?: "dark" | "white";
};

const DEFAULT_HREFS: Record<StoreButtonProps["store"], string> = {
  chrome: "/dashboard#account",
  web: "/dashboard"
};

export function StoreButton({ store, href, tone = "dark" }: StoreButtonProps) {
  const isChrome = store === "chrome";
  const toneClasses =
    tone === "dark"
      ? "bg-[#0a1633] text-white hover:bg-[#1b2b52] focus-visible:outline-[#1468F5]"
      : "bg-white text-[#0a1633] hover:bg-[#eaf1fe] focus-visible:outline-white";

  return (
    <Link
      href={href ?? DEFAULT_HREFS[store]}
      aria-label={isChrome ? "Add the extension to Chrome" : "Open the web dashboard"}
      className={`inline-flex items-center gap-3 rounded-full px-5 py-3 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${toneClasses}`}
    >
      {isChrome ? <Puzzle size={20} aria-hidden /> : <LayoutDashboard size={20} aria-hidden />}
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-wide opacity-75">
          {isChrome ? "Get the extension" : "Track & manage"}
        </span>
        <span className="block text-sm font-bold">{isChrome ? "Add to Chrome" : "Web Dashboard"}</span>
      </span>
    </Link>
  );
}
