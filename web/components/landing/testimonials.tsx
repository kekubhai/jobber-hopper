"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TESTIMONIALS } from "@/lib/landing-data";
import { TestimonialCard } from "./testimonial-card";

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("figure");
    const step = card ? card.getBoundingClientRect().width + 24 : 360;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          Real people, real stories
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Previous testimonials"
            onClick={() => scrollByCard(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-[#1468F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next testimonials"
            onClick={() => scrollByCard(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-[#1468F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:overflow-visible"
      >
        {TESTIMONIALS.map((testimonial) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}
