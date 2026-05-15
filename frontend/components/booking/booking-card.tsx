"use client";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";
import type { Booking } from "@/types";
import { Calendar, MapPin, Users, Ticket } from "lucide-react";

interface BookingCardProps {
  booking: Booking;
  className?: string;
}

export function BookingCard({ booking, className }: BookingCardProps) {
  const tourImage = booking.tour?.images?.[0];

  return (
    <Link href={`/bookings/${booking.id}`}>
      <Card variant="outline" className={cn(
        "p-4 hover:shadow-card-hover transition-shadow cursor-pointer",
        className
      )}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tour image */}
          {tourImage ? (
            <div className="relative w-full sm:w-32 h-24 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={tourImage}
                alt={booking.tour?.name ?? "Tour"}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ) : (
            <div className="w-full sm:w-32 h-24 rounded-md bg-lightest-gray flex items-center justify-center flex-shrink-0">
              <Ticket className="w-8 h-8 text-medium-gray" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-navy truncate">
                  {booking.tour?.name ?? "Tour đã đặt"}
                </p>
                <p className="text-metadata text-dark-gray flex items-center gap-1 mt-0.5">
                  <Ticket className="w-3 h-3" />
                  <span className="font-mono text-muted-foreground">
                    {booking.booking_code}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <BookingStatusBadge status={booking.status} />
                <PaymentStatusBadge status={booking.payment_status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-metadata text-dark-gray">
              {booking.tour?.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {booking.tour.destination}
                </span>
              )}
              {booking.departure_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(booking.departure_date), "dd/MM/yyyy", { locale: vi })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.num_adults} người lớn
                {booking.num_children > 0 && ` + ${booking.num_children} trẻ em`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-body font-bold text-primary">
                {formatPrice(booking.total_price)}
              </span>
              <span className="text-metadata text-medium-gray">
                {format(new Date(booking.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
