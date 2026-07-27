import { Bookmark, Briefcase } from "lucide-react";
import type { MockJob } from "@/lib/landing-data";

const TONE_STYLES: Record<MockJob["tone"], { badge: string; icon: string }> = {
  blue: { badge: "bg-[#eaf1fe] text-[#1468F5]", icon: "bg-[#1468F5]" },
  coral: { badge: "bg-[#ffecec] text-[#f0453f]", icon: "bg-[#f0453f]" },
  orange: { badge: "bg-[#fff3e6] text-[#f5820f]", icon: "bg-[#f5820f]" },
  navy: { badge: "bg-[#e9edf6] text-[#0a1633]", icon: "bg-[#0a1633]" }
};

type JobCardMockupProps = {
  job: MockJob;
  compact?: boolean;
  className?: string;
};

export function JobCardMockup({ job, compact = false, className = "" }: JobCardMockupProps) {
  const tone = TONE_STYLES[job.tone];

  return (
    <div
      className={`rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-sm ${className}`}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${tone.icon}`}>
            <Briefcase size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-[#0a1633]">{job.role}</p>
            <p className="text-xs text-[#5b6478]">{job.company}</p>
          </div>
        </div>
        <Bookmark size={16} className="text-[#a7b0c4]" />
      </div>
      {!compact ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone.badge}`}>
              {tag}
            </span>
          ))}
          <span className="ml-auto text-xs font-bold text-[#0a1633]">{job.salary}</span>
        </div>
      ) : null}
    </div>
  );
}
