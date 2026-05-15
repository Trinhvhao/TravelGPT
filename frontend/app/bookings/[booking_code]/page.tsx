"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { bookingApi } from "@/lib/booking-api";
import type { Booking } from "@/types";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  User as UserIcon,
  Mail,
  Phone,
  MessageSquare,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Ticket,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ─── Status ─────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "secondary" | "neutral"; label: string }> = {
    PENDING:    { variant: "warning", label: "Đang chờ" },
    CONFIRMED:  { variant: "success", label: "Đã xác nhận" },
    CANCELLED:  { variant: "destructive", label: "Đã hủy" },
    COMPLETED:  { variant: "secondary", label: "Hoàn thành" },
    PROCESSING:  { variant: "warning", label: "Đang xử lý" },
  };
  const s = map[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "neutral" | "destructive"; label: string }> = {
    UNPAID:   { variant: "warning", label: "Chưa thanh toán" },
    PAID:     { variant: "success", label: "Đã thanh toán" },
    REFUNDED: { variant: "neutral", label: "Đã hoàn tiền" },
    FAILED:   { variant: "destructive", label: "Thanh toán thất bại" },
  };
  const s = map[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Cancel Modal ────────────────────────────────────────────────────────────────
function CancelModal({
  booking,
  open,
  onClose,
  onConfirm,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");

  const isConfirmed = code.toUpperCase() === booking.booking_code.toUpperCase();

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setConfirming(true);
    try {
      await onConfirm();
      toast.success("Đã hủy đơn đặt tour thành công!");
      onClose();
    } catch {
      toast.error("Không thể hủy đơn. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Hủy đặt tour</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2]">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#000E1A]">
              <p className="font-semibold mb-1">Bạn có chắc muốn hủy đơn này?</p>
              <p className="text-[#636363]">
                Hành động này không thể hoàn tác. Chính sách hoàn tiền sẽ được áp dụng.
              </p>
            </div>
          </div>

          {/* Booking info */}
          <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#DDDDDD] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#636363]">Mã booking</span>
              <span className="font-mono font-bold text-[#0046C1]">{booking.booking_code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#636363]">Tour</span>
              <span className="font-medium text-[#000E1A]">{booking.tour?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#636363]">Ngày khởi hành</span>
              <span className="font-medium text-[#000E1A]">
                {booking.departure_date ? formatDate(booking.departure_date) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#636363]">Tổng tiền</span>
              <span className="font-bold text-[#0046C1]">
                {formatPrice(Number(booking.total_price))}
              </span>
            </div>
          </div>

          {/* Refund info */}
          <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
            <p className="text-xs font-semibold text-[#16A34A] mb-2">Chính sách hoàn tiền</p>
            <div className="text-xs text-[#636363] space-y-1">
              <p>• Hủy trước 7 ngày: Hoàn 80%</p>
              <p>• Hủy trước 3 ngày: Hoàn 50%</p>
              <p>• Hủy trước 1 ngày: Hoàn 20%</p>
              <p>• Hủy trong ngày: Không hoàn tiền</p>
            </div>
          </div>

          {/* Confirm input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#000E1A]">
              Nhập mã booking để xác nhận hủy
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={booking.booking_code}
              className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#000E1A] focus:outline-none focus:ring-2 focus:ring-[#0046C1]/20 focus:border-[#0046C1] transition-all font-mono text-center uppercase tracking-wider"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[#DDDDDD]" disabled={confirming}>
              Giữ đơn
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="flex-1"
              disabled={!isConfirmed || confirming}
            >
              {confirming ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang hủy...</>
              ) : (
                <><X className="w-4 h-4 mr-2" />Xác nhận hủy</>
              )}
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingCode = params.booking_code as string;
  const { isAuthenticated, isLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchBooking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const fetchBooking = async () => {
    try {
      const data = await bookingApi.getByCode(bookingCode);
      setBooking(data);
    } catch {
      toast.error("Không tìm thấy đơn đặt tour");
      router.push("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(booking.id);
      await fetchBooking();
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Ticket}
            title="Không tìm thấy đơn đặt tour"
            description="Mã booking không đúng hoặc đơn đã bị xóa."
            action={<Link href="/bookings"><Button>Quay về danh sách</Button></Link>}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const tourImage =
    booking.tour?.images?.[0] &&
    (typeof booking.tour.images[0] === "string"
      ? booking.tour.images[0]
      : (booking.tour.images[0] as { url: string }).url);

  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-[#0046C1] pt-12 pb-10 px-4">
          <div className="container-page">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay về danh sách đơn
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-extrabold text-white">
                    {booking.tour?.name || "Tour đã xóa"}
                  </h1>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Ticket className="w-4 h-4" />
                  Mã booking:{" "}
                  <span className="font-mono font-bold text-white">
                    {booking.booking_code}
                  </span>
                </div>
              </div>
              <PaymentBadge status={booking.payment_status} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container-page py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tour image */}
              {tourImage && (
                <Card className="overflow-hidden border border-[#DDDDDD]">
                  <img
                    src={tourImage}
                    alt={booking.tour?.name}
                    className="w-full h-64 object-cover"
                  />
                </Card>
              )}

              {/* Tour Info */}
              <Card className="border border-[#DDDDDD]">
                <div className="px-6 py-5 border-b border-[#DDDDDD]">
                  <h2 className="font-bold text-[#000E1A]">Thông tin tour</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        icon: Calendar,
                        label: "Ngày khởi hành",
                        value: booking.departure_date ? formatDate(booking.departure_date) : "—",
                      },
                      {
                        icon: Clock,
                        label: "Thời gian",
                        value: booking.tour?.duration || "—",
                      },
                      {
                        icon: MapPin,
                        label: "Điểm đến",
                        value: booking.tour?.region || booking.tour?.destination || "—",
                      },
                      {
                        icon: Users,
                        label: "Số khách",
                        value: `${booking.num_adults ?? 0} người lớn${(booking.num_children ?? 0) > 0 ? `, ${booking.num_children} trẻ em` : ""}`,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-[#0046C1]" />
                          </div>
                          <div>
                            <p className="text-xs text-[#636363]">{item.label}</p>
                            <p className="text-sm font-semibold text-[#000E1A]">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {booking.special_requests && (
                    <div className="pt-4 border-t border-[#DDDDDD]">
                      <p className="text-xs text-[#636363] mb-1">Yêu cầu đặc biệt</p>
                      <p className="text-sm text-[#000E1A]">{booking.special_requests}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="border border-[#DDDDDD]">
                <div className="px-6 py-5 border-b border-[#DDDDDD]">
                  <h2 className="font-bold text-[#000E1A]">Thông tin liên hệ</h2>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    { icon: UserIcon, label: "Họ tên", value: booking.contact_name },
                    { icon: Mail, label: "Email", value: booking.contact_email },
                    { icon: Phone, label: "Điện thoại", value: booking.contact_phone || "—" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-[#0046C1] flex-shrink-0" />
                        <div>
                          <p className="text-xs text-[#636363]">{item.label}</p>
                          <p className="text-sm font-medium text-[#000E1A]">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right: Summary */}
            <div className="space-y-6">
              {/* Price Summary */}
              <Card className="border border-[#DDDDDD] shadow-sm overflow-hidden">
                <div className="bg-[#0046C1] px-6 py-4">
                  <h2 className="font-bold text-white">Thanh toán</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#636363]">
                      Người lớn × {booking.num_adults}
                    </span>
                    <span className="text-[#000E1A]">
                      {formatPrice(Number(booking.total_price) * 0.9)}
                    </span>
                  </div>
                  {(booking.num_children ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#636363]">
                        Trẻ em × {booking.num_children}
                      </span>
                      <span className="text-[#000E1A]">
                        {formatPrice(Number(booking.total_price) * 0.1)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-[#DDDDDD] pt-3 flex justify-between items-center">
                    <span className="font-bold text-[#000E1A]">Tổng cộng</span>
                    <span className="text-xl font-extrabold text-[#0046C1]">
                      {formatPrice(Number(booking.total_price))}
                    </span>
                  </div>
                  {booking.payment_date && (
                    <div className="text-xs text-[#636363] text-center pt-1">
                      Thanh toán ngày {formatDate(booking.payment_date)}
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <Card className="border border-[#DDDDDD]">
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-[#000E1A] mb-3">Thao tác</h3>

                  <Link href="/chat" className="block">
                    <Button variant="secondary" className="w-full gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Nhắn hỗ trợ
                    </Button>
                  </Link>

                  <Link href={`/tours/${booking.tour?.slug}`} className="block">
                    <Button variant="outline" className="w-full gap-2 border-[#DDDDDD]">
                      <RefreshCw className="w-4 h-4" />
                      Đặt lại tour này
                    </Button>
                  </Link>

                  {canCancel && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-[#FEE2E2] text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#DC2626]"
                      onClick={() => setCancelModal(true)}
                      disabled={cancelling}
                    >
                      <X className="w-4 h-4" />
                      Hủy đặt tour
                    </Button>
                  )}
                </div>
              </Card>

              {/* Trust */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F7F7F7] border border-[#DDDDDD]">
                <Shield className="w-5 h-5 text-[#0046C1] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#636363]">
                  <p className="font-semibold text-[#000E1A]">Hỗ trợ 24/7</p>
                  <p className="mt-1">Đội ngũ TravelGPT luôn sẵn sàng hỗ trợ bạn qua hotline 1900 1234.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Modal */}
      {booking && (
        <CancelModal
          booking={booking}
          open={cancelModal}
          onClose={() => setCancelModal(false)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}
