import { Check, TriangleAlert, Zap } from "lucide-react";
import { POPUP_FIELD_ROWS } from "@/lib/landing-data";

type PhoneMockupProps = {
  className?: string;
};

/**
 * Structured extension-popup mockup used in the hero and CTA panels.
 * Shows the real Jobber Hopper flow: platform detected, fields reviewed
 * with safe/manual states, one-tap autofill, application tracked.
 */
export function PhoneMockup({ className = "" }: PhoneMockupProps) {
  return (
    <div
      className={`w-[280px] rounded-[2.4rem] border-[10px] border-[#0a1633] bg-[#f5f7fb] shadow-2xl shadow-[#0a1633]/30 ${className}`}
      role="img"
      aria-label="Jobber Hopper extension reviewing a Greenhouse application: 24 of 28 fields safe to autofill"
    >
      <div className="rounded-[1.8rem] bg-[#f5f7fb] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1468F5] text-white">
              <Zap size={13} fill="currentColor" />
            </span>
            <p className="text-sm font-extrabold text-[#0a1633]">Jobber Hopper</p>
          </div>
          <span className="rounded-full bg-[#eafbf1] px-2 py-0.5 text-[9px] font-bold text-[#0f9d58]">
            Linked
          </span>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-[#5b6478]">Greenhouse form detected</p>
          <p className="text-xs font-bold text-[#0a1633]">Senior UX Researcher · Lumina Labs</p>
          <p className="mt-1 text-[10px] text-[#5b6478]">
            <span className="font-bold text-[#1468F5]">28 fields found</span> · 24 safe to fill
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          {POPUP_FIELD_ROWS.map((row) => (
            <div
              key={row.label}
              className={`flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2 ${
                row.safe ? "border-[#d9f2e4]" : "border-[#fde4c8]"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  row.safe ? "bg-[#eafbf1] text-[#0f9d58]" : "bg-[#fff3e6] text-[#f5820f]"
                }`}
              >
                {row.safe ? <Check size={9} strokeWidth={3.5} /> : <TriangleAlert size={9} strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-semibold uppercase tracking-wide text-[#a7b0c4]">
                  {row.label}
                </span>
                <span
                  className={`block truncate text-[10px] font-semibold ${
                    row.safe ? "text-[#0a1633]" : "text-[#b45309]"
                  }`}
                >
                  {row.value}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 rounded-full bg-[#1468F5] py-2.5 text-center text-xs font-bold text-white">
          Autofill 24 safe fields
        </div>

        <div className="mt-2 rounded-2xl bg-[#0a1633] p-3 text-white">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Tracked automatically</p>
          <p className="mt-0.5 text-xs font-bold">Lumina Labs · UX Researcher</p>
          <p className="text-[10px] text-white/60">Applied today · Status: In review</p>
        </div>
      </div>
    </div>
  );
}
