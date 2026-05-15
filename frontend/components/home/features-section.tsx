"use client";

import Image from "next/image";
import { FEATURES } from "@/data/home-data";
import Link from "next/link";
import { Bot, Map, ShieldCheck, Heart, Zap } from "lucide-react";

const FEATURE_SPANS: Record<string, string> = {
  wide: "md:col-span-2 lg:col-span-2",
  tall: "row-span-2",
  normal: "",
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  Bot: <Bot className="w-6 h-6 text-white" />,
  Map: <Map className="w-6 h-6 text-white" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-white" />,
  Heart: <Heart className="w-6 h-6 text-white" />,
};

export default function FeaturesSection() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: "#F7F7F7" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: "linear-gradient(135deg, #0046C1, #0391FF)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{
            background: "linear-gradient(135deg, #0391FF, #77DD77)",
            transform: "translate(-30%, 30%)",
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold mb-6"
            style={{
              backgroundColor: "#0046C1",
              color: "#FFFFFF",
              borderRadius: "50px",
            }}
          >
            <Zap className="w-4 h-4" />
            Ưu điểm vượt trội
          </div>
          <h2
            className="text-4xl md:text-5xl lg:text-[56px] font-bold mb-6 leading-tight"
            style={{ color: "#000E1A" }}
          >
            Tại sao chọn{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #0046C1, #0391FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              TravelGPT
            </span>
            ?
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: "#4D4D4D" }}
          >
            Kết hợp công nghệ AI tiên tiến với dịch vụ du lịch chất lượng cao
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden transition-all duration-500 hover:shadow-xl cursor-pointer ${
                FEATURE_SPANS[feature.span ?? "normal"]
              }`}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "24px",
                border: "1px solid #DDDDDD",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              {/* Gradient accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{
                  background:
                    feature.iconKey === "Bot"
                      ? "linear-gradient(90deg, #0046C1, #0391FF)"
                      : feature.iconKey === "Map"
                      ? "linear-gradient(90deg, #0391FF, #77DD77)"
                      : feature.iconKey === "ShieldCheck"
                      ? "linear-gradient(90deg, #77DD77, #F8C700)"
                      : "linear-gradient(90deg, #E67E22, #0046C1)",
                }}
              />

              <div className="p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      background:
                        feature.iconKey === "Bot"
                          ? "linear-gradient(135deg, #0046C1, #0391FF)"
                          : feature.iconKey === "Map"
                          ? "linear-gradient(135deg, #0391FF, #77DD77)"
                          : feature.iconKey === "ShieldCheck"
                          ? "linear-gradient(135deg, #77DD77, #F8C700)"
                          : "linear-gradient(135deg, #E67E22, #0046C1)",
                    }}
                  >
                    {FEATURE_ICONS[feature.iconKey]}
                  </div>
                  <div>
                    <span
                      className="px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: feature.color,
                        color: "#FFFFFF",
                        borderRadius: "20px",
                      }}
                    >
                      {feature.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold" style={{ color: "#000E1A" }}>
                  {feature.title}
                </h3>

                <div className="relative h-40 rounded-xl overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(to top, rgba(0,70,193,0.4) 0%, transparent 60%)",
                    }}
                  />
                </div>

                <p className="leading-relaxed" style={{ color: "#4D4D4D" }}>
                  {feature.description}
                </p>

                <Link
                  href="/tours"
                  className="group/btn flex items-center gap-2 text-sm font-semibold transition-all"
                  style={{ color: feature.color }}
                >
                  Tìm hiểu thêm
                  <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
