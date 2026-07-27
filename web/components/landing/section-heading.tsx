type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "white";
  as?: "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  as: Tag = "h2"
}: SectionHeadingProps) {
  const alignClasses = align === "center" ? "text-center items-center" : "text-left items-start";
  const titleColor = tone === "white" ? "text-white" : "text-[#0a1633]";
  const bodyColor = tone === "white" ? "text-white/80" : "text-[#5b6478]";
  const eyebrowColor = tone === "white" ? "text-white/80" : "text-[#1468F5]";

  return (
    <div className={`flex flex-col gap-4 ${alignClasses}`}>
      {eyebrow ? (
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${eyebrowColor}`}>{eyebrow}</p>
      ) : null}
      <Tag className={`max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] ${titleColor}`}>
        {title}
      </Tag>
      {description ? <p className={`max-w-xl text-base leading-relaxed ${bodyColor}`}>{description}</p> : null}
    </div>
  );
}
