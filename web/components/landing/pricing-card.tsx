import { Check } from "lucide-react";
import type { PricingPlan } from "@/lib/landing-data";
import { PrimaryButton } from "./primary-button";

type PricingCardProps = {
  plan: PricingPlan;
};

export function PricingCard({ plan }: PricingCardProps) {
  const emphasized = Boolean(plan.emphasized);

  return (
    <article
      className={`relative flex h-full flex-col rounded-3xl border p-8 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none ${
        emphasized
          ? "grid-tex-blue border-[#1468F5] bg-[#1468F5] text-white shadow-xl shadow-[#1468F5]/25"
          : "border-[#e6eaf2] bg-white text-[#0a1633] shadow-sm"
      }`}
    >
      {emphasized ? (
        <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold tracking-widest text-[#1468F5]">
          POPULAR
        </span>
      ) : null}

      <h3 className={`text-sm font-bold uppercase tracking-wide ${emphasized ? "text-white/85" : "text-[#5b6478]"}`}>
        {plan.name}
      </h3>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-extrabold tabular-nums tracking-tight">{plan.price}</span>
        <span className={`text-sm font-medium ${emphasized ? "text-white/75" : "text-[#5b6478]"}`}>{plan.period}</span>
      </p>
      <p className={`mt-3 text-sm leading-relaxed ${emphasized ? "text-white/85" : "text-[#5b6478]"}`}>
        {plan.description}
      </p>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                emphasized ? "bg-white text-[#f5820f]" : "bg-[#fff3e6] text-[#f5820f]"
              }`}
            >
              <Check size={12} strokeWidth={3} aria-hidden />
            </span>
            <span className={emphasized ? "text-white/95" : "text-[#0a1633]"}>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PrimaryButton
          href="/dashboard"
          variant={emphasized ? "white" : "white-outline"}
          className="w-full"
        >
          {plan.cta}
        </PrimaryButton>
      </div>
    </article>
  );
}
