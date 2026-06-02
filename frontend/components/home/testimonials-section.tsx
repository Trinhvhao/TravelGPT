"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Minh Anh",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    location: "Hà Nội",
    rating: 5,
    content:
      "Mình đặt tour Đà Nẵng qua TravelGPT và rất hài lòng. AI tư vấn nhanh, đặt dễ dàng. Đã giới thiệu cho nhiều bạn bè!",
  },
  {
    name: "Hoàng Nam",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    location: "TP. Hồ Chí Minh",
    rating: 5,
    content:
      "Tour Phú Quốc 4N3Đ giá tốt hơn nhiều so với các trang khác. Dịch vụ chuyên nghiệp, hướng dẫn viên nhiệt tình.",
  },
  {
    name: "Thu Hà",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    location: "Đà Nẵng",
    rating: 5,
    content:
      "Lần đầu sử dụng AI để đặt tour, trải nghiệm rất tuyệt vời. AI hiểu đúng nhu cầu của mình và gợi ý tour phù hợp.",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className="py-20 lg:py-28 overflow-hidden relative"
      style={{ backgroundColor: "#F7F7F7" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full mb-4"
            style={{
              backgroundColor: "#D9EEFF",
              color: "#0046C1",
            }}
          >
            <Quote className="w-4 h-4" />
            <span>Đánh giá từ khách hàng</span>
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: "#000E1A" }}
          >
            Khách hàng nói gì về chúng tôi
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "#636363" }}
          >
            Hàng nghìn khách hàng đã tin tưởng và trải nghiệm dịch vụ của TravelGPT
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 lg:p-8 rounded-2xl transition-all duration-300 hover:shadow-xl"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                border: "1px solid #E8F4FF",
              }}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#F8C700] text-[#F8C700]"
                  />
                ))}
              </div>

              {/* Content */}
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: "#4D4D4D" }}
              >
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden relative"
                  style={{ border: "3px solid #E8F4FF" }}
                >
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p
                    className="font-bold"
                    style={{ color: "#000E1A" }}
                  >
                    {testimonial.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "#636363" }}
                  >
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
