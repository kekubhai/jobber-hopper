import { Bell, Check, FileText, Upload } from "lucide-react";
import { CATEGORY_BUBBLES, HERO_JOBS } from "@/lib/landing-data";
import { JobCardMockup } from "./job-card-mockup";

/** One-tap autofill card with a blue CTA. */
export function ApplyMockup() {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-sm" aria-hidden>
      <JobCardMockup job={HERO_JOBS[1]} compact className="border-0 p-0 shadow-none" />
      <div className="mt-3 space-y-2">
        {["Profile matched · 24 fields", "Resume attached", "Review before submit"].map((line) => (
          <p key={line} className="flex items-center gap-2 text-xs text-[#5b6478]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#eafbf1] text-[#0f9d58]">
              <Check size={10} strokeWidth={3} />
            </span>
            {line}
          </p>
        ))}
      </div>
      <div className="mt-4 rounded-full bg-[#1468F5] py-2.5 text-center text-xs font-bold text-white">
        Autofill in one tap
      </div>
    </div>
  );
}

/** Resume upload extracting profile data. */
export function ResumeImportMockup() {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-sm" aria-hidden>
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#1468F5]/40 bg-[#f5f9ff] p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf1fe] text-[#1468F5]">
          <Upload size={15} />
        </span>
        <div>
          <p className="text-xs font-bold text-[#0a1633]">jordan-alvarez-resume.pdf</p>
          <p className="text-[10px] text-[#5b6478]">PDF · imported in seconds</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {["Work history · 3 roles", "Education · 1 degree", "Contact & links filled"].map((line) => (
          <p key={line} className="flex items-center gap-2 text-xs text-[#5b6478]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#eafbf1] text-[#0f9d58]">
              <Check size={10} strokeWidth={3} />
            </span>
            {line}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f5f7fb] p-2.5">
        <FileText size={14} className="text-[#f5820f]" />
        <span className="text-[10px] font-semibold text-[#5b6478]">Review, then save to your profile</span>
      </div>
    </div>
  );
}

const TRACKER_ROWS = [
  { company: "Lumina Labs", role: "UX Researcher", status: "Interviewing", tone: "bg-[#eafbf1] text-[#0f9d58]" },
  { company: "Northbeam", role: "Web Engineer", status: "Applied", tone: "bg-[#eaf1fe] text-[#1468F5]" },
  { company: "Skyline", role: "Product Manager", status: "In review", tone: "bg-[#fff3e6] text-[#f5820f]" }
];

/** Application tracker rows with statuses. */
export function TrackerMockup() {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-sm" aria-hidden>
      <p className="text-xs font-bold text-[#0a1633]">Your applications</p>
      <div className="mt-3 flex flex-col gap-2">
        {TRACKER_ROWS.map((row) => (
          <div key={row.company} className="flex items-center justify-between gap-2 rounded-xl bg-[#f5f7fb] px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#0a1633]">{row.company}</p>
              <p className="truncate text-[10px] text-[#5b6478]">{row.role}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${row.tone}`}>{row.status}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] font-semibold text-[#5b6478]">Logged automatically after every fill</p>
    </div>
  );
}

/** Application status update card with floating badge and CTA pill. */
export function NotificationMockup() {
  return (
    <div className="relative" aria-hidden>
      <div className="rounded-2xl border border-[#e6eaf2] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5b6478]">Just now</p>
        <JobCardMockup job={HERO_JOBS[0]} className="mt-3 border-0 p-0 shadow-none" />
        <p className="mt-3 text-xs text-[#5b6478]">
          Autofill complete — application logged to your tracker with company, role, and date. Status moves to
          “Applied” the moment you submit.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1468F5] px-5 py-2.5 text-xs font-bold text-white">
          <Bell size={13} />
          Open the tracker
        </div>
      </div>
      <span className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f0453f] text-white shadow-lg shadow-[#f0453f]/40">
        <Bell size={18} />
      </span>
    </div>
  );
}

const BUBBLE_TONES: Record<string, string> = {
  blue: "bg-[#1468F5] text-white",
  coral: "bg-[#f0453f] text-white",
  orange: "bg-[#f5820f] text-white",
  navy: "bg-[#0a1633] text-white",
  gray: "bg-white text-[#0a1633] border border-[#e6eaf2]"
};

/** Clustered ATS-platform bubbles. */
export function CategoryBubbles() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" aria-hidden>
      {CATEGORY_BUBBLES.map((bubble, index) => (
        <span
          key={bubble.label}
          className={`rounded-full px-5 py-3 text-sm font-semibold shadow-sm ${BUBBLE_TONES[bubble.tone]} ${
            index % 3 === 1 ? "translate-y-2" : index % 3 === 2 ? "-translate-y-1" : ""
          }`}
        >
          {bubble.label}
        </span>
      ))}
    </div>
  );
}
