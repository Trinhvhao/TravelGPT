"use client";

import { STATS } from "@/data/home-data";
import { useState, useRef, useEffect } from "react";
import { Map, Users, Star, Bot } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-16 relative -mt-8 z-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1400&q=80"
              alt="Beautiful tropical beach"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,14,26,0.85)" }} />
          </div>

          <div className="relative p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: `${s.color}25`,
                    borderRadius: "12px",
                  }}
                >
                  <span className="text-3xl font-bold" style={{ color: s.color }}>
                    {s.iconKey === "Map" && <Map className="w-8 h-8" />}
                    {s.iconKey === "Users" && <Users className="w-8 h-8" />}
                    {s.iconKey === "Star" && <Star className="w-8 h-8" />}
                    {s.iconKey === "Bot" && <Bot className="w-8 h-8" />}
                  </span>
                </div>
                <p
                  className="text-4xl md:text-5xl font-bold mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
