import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getDestinationImage } from "@/lib/destination-images";
import { MapPin, Clock, Star } from "lucide-react";

interface TourCardProps {
  tour: {
    id: string;
    slug: string;
    name: string;
    destination: string;
    duration: string;
    price: number | string;
    discount_price?: number | string | null;
    images: string[] | { url: string; alt?: string }[];
    rating: number | string;
    review_count: number;
    is_featured?: boolean;
  };
}

export function TourCard({ tour }: TourCardProps) {
  const firstImage = tour.images?.[0];
  const imageUrl = typeof firstImage === "string"
    ? firstImage
    : firstImage?.url;
  const displayImage = imageUrl || getDestinationImage(tour.destination);

  const displayPrice = tour.discount_price || tour.price;
  const hasDiscount =
    tour.discount_price &&
    Number(tour.discount_price) < Number(tour.price);
  const discountPct = hasDiscount
    ? Math.round(
        (1 - Number(tour.discount_price) / Number(tour.price)) * 100
      )
    : 0;

  return (
    <Link href={`/tours/${tour.slug}`} className="block">
      <Card
        variant="flat"
        className="overflow-hidden cursor-pointer
                   hover:shadow-floating hover:translate-y-[-2px]
                   transition-all duration-200 ease-in-out h-full"
        style={{ boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.10)" }}
      >
        {/* Image section */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <img
            src={displayImage}
            alt={tour.name}
            className="w-full h-full object-cover
                       group-hover:scale-105
                       transition-transform duration-300 ease-in-out"
            style={{ minHeight: "160px" }}
          />

          {/* Badge: Featured */}
          {tour.is_featured && (
            <Badge
              variant="default"
              className="absolute top-3 left-3"
            >
              Nổi bật
            </Badge>
          )}

          {/* Badge: Discount */}
          {hasDiscount && (
            <Badge
              variant="destructive"
              className="absolute top-3 right-3"
            >
              -{discountPct}%
            </Badge>
          )}
        </div>

        {/* Content section */}
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Title */}
          <h3
            className="text-[16px] font-bold text-navy leading-[20px]
                       line-clamp-2
                       group-hover:text-primary transition-colors duration-200"
          >
            {tour.name}
          </h3>

          {/* Meta: destination & duration */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[14px] font-normal text-dark-gray">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              {tour.destination}
            </span>
            <span className="flex items-center gap-1.5 text-[14px] font-normal text-dark-gray">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              {tour.duration}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <Star
              className="h-4 w-4 text-warning shrink-0 fill-warning"
            />
            <span className="text-[14px] font-semibold text-navy">
              {Number(tour.rating).toFixed(1)}
            </span>
            <span className="text-[14px] font-normal text-dark-gray">
              ({tour.review_count} đánh giá)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-2 mt-auto pt-1">
            {hasDiscount && (
              <span className="text-[13px] font-normal text-medium-gray line-through">
                {formatPrice(Number(tour.price))}
              </span>
            )}
            <span
              className="text-[16px] font-bold leading-[20px]"
              style={{ color: "#F8C700" }}
            >
              {formatPrice(Number(displayPrice))}
            </span>
            <span className="text-[13px] font-normal text-dark-gray mb-0.5">
              /người
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
