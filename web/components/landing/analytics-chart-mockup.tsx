import { TrendingUp } from "lucide-react";

const BARS = [
  { label: "Mon", value: 38 },
  { label: "Tue", value: 56 },
  { label: "Wed", value: 44 },
  { label: "Thu", value: 78 },
  { label: "Fri", value: 92 },
  { label: "Sat", value: 62 },
  { label: "Sun", value: 70 }
];

type AnalyticsChartMockupProps = {
  title?: string;
  metric?: string;
  className?: string;
};

export function AnalyticsChartMockup({
  title = "Applications this week",
  metric = "+32%",
  className = ""
}: AnalyticsChartMockupProps) {
  return (
    <div className={`rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-sm ${className}`} aria-hidden>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#5b6478]">{title}</p>
        <span className="flex items-center gap-1 rounded-full bg-[#eafbf1] px-2 py-0.5 text-[10px] font-bold text-[#0f9d58]">
          <TrendingUp size={11} />
          {metric}
        </span>
      </div>
      <div className="mt-4 flex h-28 items-end gap-2">
        {BARS.map((bar, index) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-t-md ${index === 4 ? "bg-[#1468F5]" : "bg-[#dbe7fd]"}`}
              style={{ height: `${bar.value}%` }}
            />
            <span className="text-[9px] font-medium text-[#a7b0c4]">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
