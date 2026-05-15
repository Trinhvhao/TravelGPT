"use client";

import Image from "next/image";
import { STEPS } from "@/data/home-data";
import { MessageSquare, Search, Calendar, CheckCircle2 } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
};

export default function HowItWorksSection() {
  return (
    <section className="py-20" style={{ backgroundColor: "#F7F7F7" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 text-sm font-semibold mb-4"
            style={{
              backgroundColor: "#D9EEFF",
              color: "#0046C1",
              borderRadius: "12px",
            }}
          >
            Quy trình
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: "#000E1A" }}
          >
            Chỉ 4 bước đơn giản
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "#4D4D4D" }}
          >
            Từ ý tưởng đến hành trình — tất cả trong một cuộc trò chuyện với AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="group relative overflow-hidden transition-all duration-500 hover:-translate-y-2"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #DDDDDD",
                borderRadius: "12px",
              }}
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, rgba(0,14,26,0.7) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: step.color,
                    color: "#FFFFFF",
                    borderRadius: "10px",
                  }}
                >
                  {step.num}
                </div>
              </div>

              <div className="p-5">
                <div
                  className="w-12 h-12 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 text-xl"
                  style={{
                    backgroundColor: `${step.color}15`,
                    borderRadius: "12px",
                  }}
                >
                  {STEP_ICONS[step.iconKey]}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#000E1A" }}>
                  {step.title}
                </h3>
                <p className="leading-relaxed text-sm" style={{ color: "#4D4D4D" }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
