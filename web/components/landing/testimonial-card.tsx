import type { Testimonial } from "@/lib/landing-data";

const AVATAR_TONES: Record<Testimonial["tone"], string> = {
  blue: "bg-[#1468F5]",
  coral: "bg-[#f0453f]",
  orange: "bg-[#f5820f]"
};

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <figure className="flex h-full min-w-[280px] snap-start flex-col justify-between rounded-3xl bg-white p-7 shadow-lg shadow-[#0a1633]/10 sm:min-w-[340px]">
      <blockquote className="text-[15px] leading-relaxed text-[#0a1633]">“{testimonial.quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_TONES[testimonial.tone]}`}
          aria-hidden
        >
          {testimonial.initials}
        </span>
        <span>
          <span className="block text-sm font-bold text-[#0a1633]">{testimonial.name}</span>
          <span className="block text-xs text-[#5b6478]">{testimonial.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
