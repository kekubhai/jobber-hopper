"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { STATS, type StatItem } from "@/lib/landing-data";

function CountUpValue({ target, suffix }: { target: number; suffix: string }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? target : 0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(target);
      return;
    }
    const node = spanRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const duration = 1200;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, reduceMotion]);

  return (
    <span ref={spanRef} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

function StaticValue({ value }: { value: string }) {
  return <span className="tabular-nums">{value}</span>;
}

export function Stats({ items }: { items?: StatItem[] } = {}) {
  const data = items ?? STATS;
  return (
    <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 border-l-4 border-[#1468F5] pl-5">
          <dt className="order-2 text-sm font-medium text-[#5b6478]">{stat.label}</dt>
          <dd className="order-1 text-3xl font-extrabold tracking-tight text-[#0a1633] sm:text-4xl">
            {typeof stat.value === "number" ? (
              <CountUpValue target={stat.value} suffix={stat.suffix ?? ""} />
            ) : (
              <StaticValue value={stat.value} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
