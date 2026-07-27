import type { ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

/** Pale grid-textured card with an embedded UI mockup. */
export function FeatureCard({ title, description, children, className = "" }: FeatureCardProps) {
  return (
    <article
      className={`grid-tex-light flex flex-col gap-5 rounded-3xl border border-[#e6eaf2] bg-[#f7f9fd] p-6 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none sm:p-8 ${className}`}
    >
      {children ? <div>{children}</div> : null}
      <div>
        <h3 className="text-lg font-extrabold text-[#0a1633]">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6478]">{description}</p>
      </div>
    </article>
  );
}
