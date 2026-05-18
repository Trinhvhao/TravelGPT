"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { bookingApi } from "@/lib/booking-api";
import type { Booking } from "@/types";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  User,
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
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  Download,
  Share2,
  Copy,
  QrCode,
  PlaneTakeoff,
  PlaneLanding,
  CalendarCheck,
  CopyIcon,
  CheckCheck,
  Star,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ─── Design Tokens ──────────────────────────────────────────────────────────────
const PRIMARY = "#0EA5E9";
const ACCENT = "#EA580C";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";
const NAVY = "#0C4A6E";

// ─── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: string; label: string; bg: string; color: string }> = {
    PENDING:    { variant: "warning", label: "Đang chờ xác nhận", bg: "#FEF3C7", color: "#92400E" },
    CONFIRMED:  { variant: "success", label: "Đã xác nhận", bg: "#D1FAE5", color: "#065F46" },
    CANCELLED:  { variant: "destructive", label: "Đã hủy", bg: "#FEE2E2", color: "#991B1B" },
    COMPLETED:  { variant: "secondary", label: "Hoàn thành", bg: "#E0F2FE", color: "#0369A1" },
    PROCESSING: { variant: "warning", label: "Đang xử lý", bg: "#FEF3C7", color: "#92400E" },
  };
  const s = map[status] ?? { variant: "neutral", label: status, bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status === "PENDING" && <Clock3 className="w-3.5 h-3.5" />}
      {status === "CONFIRMED" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status === "CANCELLED" && <XCircle className="w-3.5 h-3.5" />}
      {status === "COMPLETED" && <Star className="w-3.5 h-3.5" />}
      {s.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    UNPAID:   { label: "Chưa thanh toán", bg: "#FEF3C7", color: "#92400E" },
    PAID:     { label: "Đã thanh toán", bg: "#D1FAE5", color: "#065F46" },
    REFUNDED: { label: "Đã hoàn tiền", bg: "#E0F2FE", color: "#0369A1" },
    FAILED:   { label: "Thanh toán thất bại", bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[status] ?? { label: status, bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <CreditCard className="w-3.5 h-3.5" />
      {s.label}
    </span>
  );
}

// ─── Booking Timeline ────────────────────────────────────────────────────────────
function BookingTimeline({ booking }: { booking: Booking }) {
  const steps = [
    { key: "created", label: "Tạo đơn", icon: Ticket, date: booking.created_at },
    { key: "confirmed", label: "Xác nhận", icon: CheckCircle2, date: booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? booking.updated_at : null, active: booking.status !== "PENDING" },
    { key: "paid", label: "Thanh toán", icon: CreditCard, date: booking.payment_status === "PAID" ? booking.payment_date : null, active: booking.payment_status === "PAID" },
    { key: "departure", label: "Khởi hành", icon: PlaneTakeoff, date: booking.departure_date, active: booking.status === "COMPLETED" },
    { key: "completed", label: "Hoàn thành", icon: Star, date: booking.status === "COMPLETED" ? booking.updated_at : null, active: booking.status === "COMPLETED" },
  ];

  if (booking.status === "CANCELLED") {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-red-600">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">Đơn đặt tour đã bị hủy</p>
              <p className="text-sm text-red-500/80">Đơn của bạn đã được hủy vào ngày {booking.updated_at ? formatDate(booking.updated_at) : "gần đây"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStep = booking.status === "COMPLETED" ? 4 :
                      booking.payment_status === "PAID" ? 3 :
                      booking.status === "CONFIRMED" ? 2 : 1;

  return (
    <Card className="border-sky-100">
      <CardContent className="p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-500" />
          Theo dõi đơn hàng
        </h3>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep - 1;
              const isPending = idx > currentStep - 1;

              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  {/* Icon circle */}
                  <div className={cn(
                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    isCompleted ? "bg-green-500 text-white" :
                    isCurrent ? "bg-sky-500 text-white animate-pulse" :
                    "bg-slate-200 text-slate-400"
                  )}>
                    <Icon className="w-5 h-5" />
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <p className={cn(
                      "font-semibold text-sm",
                      isCompleted ? "text-green-600" :
                      isCurrent ? "text-sky-600" :
                      "text-slate-400"
                    )}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(step.date)}
                      </p>
                    )}
                    {!step.date && !isCompleted && (
                      <p className="text-xs text-slate-400 mt-0.5 italic">
                        Đang chờ...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── QR Code Section ───────────────────────────────────────────────────────────
function QRCodeSection({ bookingCode }: { bookingCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    toast.success("Đã copy mã booking!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Booking ${bookingCode}`,
        text: `Tour của tôi trên TravelGPT`,
        url: window.location.href,
      });
    } else {
      handleCopy();
    }
  };

  // Generate a simple visual QR placeholder (in production, use a real QR library)
  return (
    <Card className="border-sky-100">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-500" />
            Mã QR Booking
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {/* QR Code visual placeholder */}
          <div className="w-24 h-24 rounded-xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center flex-shrink-0">
            <div className="grid grid-cols-5 gap-0.5 w-16 h-16">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-sm",
                    Math.random() > 0.5 ? "bg-sky-600" : "bg-sky-100"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Mã booking của bạn</p>
            <p className="text-2xl font-extrabold text-sky-600 font-mono tracking-wider">{bookingCode}</p>
            <p className="text-xs text-slate-400 mt-1">Quét mã khi làm thủ tục</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCopy}>
            {copied ? <CheckCheck className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
            {copied ? "Đã copy" : "Copy mã"}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Chia sẻ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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
          <ModalTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            Hủy đặt tour
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1 text-red-800">Bạn có chắc muốn hủy đơn này?</p>
              <p className="text-red-600">
                Hành động này không thể hoàn tác. Chính sách hoàn tiền sẽ được áp dụng.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã booking</span>
              <span className="font-mono font-bold text-sky-600">{booking.booking_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tour</span>
              <span className="font-medium text-slate-800">{booking.tour?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày khởi hành</span>
              <span className="font-medium text-slate-800">
                {booking.departure_date ? formatDate(booking.departure_date) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng tiền</span>
              <span className="font-bold text-sky-600">{formatPrice(Number(booking.total_price))}</span>
            </div>
          </div>

          {/* Refund policy */}
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Chính sách hoàn tiền
            </p>
            <div className="text-xs text-green-600 space-y-1">
              <p>• Hủy trước 14 ngày: Hoàn 90%</p>
              <p>• Hủy trước 7 ngày: Hoàn 70%</p>
              <p>• Hủy trước 3 ngày: Hoàn 50%</p>
              <p>• Hủy trước 1 ngày: Hoàn 20%</p>
              <p className="text-green-500/70">* Phí xử lý 5% sẽ được khấu trừ</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Nhập mã booking để xác nhận hủy
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={booking.booking_code}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-center font-mono uppercase tracking-wider focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200" disabled={confirming}>
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

// ─── Payment Section ────────────────────────────────────────────────────────────
function PaymentSection({
  booking,
  onPaid,
}: {
  booking: Booking;
  onPaid: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const result = await bookingApi.createCheckout(booking.id);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Stripe is not configured")) {
        toast.error("Thanh toán Stripe chưa được cấu hình. Vui lòng liên hệ hỗ trợ.");
      } else {
        toast.error(msg || "Không thể tạo thanh toán. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100">
        <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">Thanh toán an toàn</p>
          <p className="text-xs text-slate-500">Bảo mật bởi Stripe. Hỗ trợ Visa, Mastercard, JCB.</p>
        </div>
      </div>

      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full h-14 font-bold text-base gap-2 shadow-lg rounded-xl"
        style={{
          background: "linear-gradient(135deg, #6772E5 0%, #9B59B6 100%)",
          border: "none",
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5" />
        )}
        Thanh toán với Stripe
      </Button>

      <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" />
        Bảo mật thanh toán bởi Stripe
      </p>
    </div>
  );
}

// ─── Success Banner ─────────────────────────────────────────────────────────────
function PaymentSuccessBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 animate-[slide-up_0.3s_ease-out]">
      <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-green-700 text-lg">Thanh toán thành công!</p>
        <p className="text-sm text-green-600">Đơn đặt tour của bạn đã được xác nhận. Cảm ơn bạn đã sử dụng TravelGPT.</p>
      </div>
      <button
        onClick={onDismiss}
        className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 text-green-600" />
      </button>
    </div>
  );
}

// ─── Info Card ─────────────────────────────────────────────────────────────────
function InfoCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Icon className="w-5 h-5 text-sky-500" />
          {title}
        </h2>
      </div>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
function BookingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingCode = params.booking_code as string;
  const paidParam = searchParams.get("paid");
  const cancelledParam = searchParams.get("cancelled");

  const { isAuthenticated, isLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Show success banner if redirected from Stripe
  useEffect(() => {
    if (paidParam === "true") {
      setShowSuccess(true);
      router.replace(`/bookings/${bookingCode}`);
    }
    if (cancelledParam === "true") {
      toast.error("Bạn đã hủy thanh toán. Có thể thanh toán lại bất kỳ lúc nào.");
      router.replace(`/bookings/${bookingCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-500">Đang tải thông tin đơn...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 to-blue-50">
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
  const canPay = booking.payment_status === "UNPAID" && booking.status === "PENDING";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <Navbar />

      <main className="flex-1">
        {/* Success Banner */}
        {showSuccess && (
          <div className="container mx-auto max-w-6xl px-4 pt-6">
            <PaymentSuccessBanner onDismiss={() => setShowSuccess(false)} />
          </div>
        )}

        {/* Hero Header */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #0284C7 50%, ${NAVY} 100%)`,
          }}
        >
          {/* Decorative */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #FFFFFF, transparent)" }} />
            <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: `linear-gradient(135deg, ${ACCENT}, transparent)` }} />
          </div>

          <div className="relative container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            {/* Back link */}
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Quay về danh sách đơn
            </Link>

            {/* Header content */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {booking.tour?.name || "Tour đã xóa"}
                  </h1>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Ticket className="w-5 h-5" />
                  <span className="text-sm">Mã booking:</span>
                  <span className="font-mono font-bold text-white text-lg tracking-wider">{booking.booking_code}</span>
                </div>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-2">
                <PaymentBadge status={booking.payment_status} />
                {canPay && (
                  <p className="text-white/60 text-sm">Cần thanh toán để xác nhận chỗ</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tour image card */}
              {tourImage && (
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                  <div className="relative h-64 md:h-80">
                    <img
                      src={tourImage}
                      alt={booking.tour?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h2 className="text-white font-bold text-xl">{booking.tour?.name}</h2>
                      {booking.tour?.destination && (
                        <p className="text-white/80 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.tour.destination}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Timeline */}
              <BookingTimeline booking={booking} />

              {/* Tour Info */}
              <InfoCard title="Thông tin tour" icon={PlaneTakeoff}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { Icon: CalendarCheck, label: "Ngày khởi hành", value: booking.departure_date ? formatDate(booking.departure_date) : "—" },
                    { Icon: Clock, label: "Thời gian", value: booking.tour?.duration || "—" },
                    { Icon: MapPin, label: "Điểm đến", value: booking.tour?.region || booking.tour?.destination || "—" },
                    { Icon: Users, label: "Số khách", value: `${booking.num_adults ?? 0} người lớn${(booking.num_children ?? 0) > 0 ? `, ${booking.num_children} trẻ em` : ""}` },
                  ].map((item) => {
                    const Icon = item.Icon;
                    return (
                      <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="font-semibold text-slate-800">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {booking.special_requests && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Yêu cầu đặc biệt
                    </p>
                    <p className="text-sm text-amber-800">{booking.special_requests}</p>
                  </div>
                )}
              </InfoCard>

              {/* Contact Info */}
              <InfoCard title="Thông tin liên hệ" icon={User}>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { Icon: User, label: "Họ tên", value: booking.contact_name },
                    { Icon: Mail, label: "Email", value: booking.contact_email },
                    { Icon: Phone, label: "Điện thoại", value: booking.contact_phone || "—" },
                  ].map((item) => {
                    const Icon = item.Icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-sky-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-sm font-medium text-slate-800 truncate">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </InfoCard>
            </div>

            {/* Right: Summary & Actions */}
            <div className="space-y-6">
              {/* QR Code */}
              <QRCodeSection bookingCode={booking.booking_code} />

              {/* Price Summary */}
              <Card className="border-sky-100 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-4">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Thanh toán
                  </h2>
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Người lớn × {booking.num_adults}</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(Number(booking.total_price) * 0.9)}
                    </span>
                  </div>
                  {(booking.num_children ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Trẻ em × {booking.num_children}</span>
                      <span className="font-medium text-slate-800">
                        {formatPrice(Number(booking.total_price) * 0.1)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Tổng cộng</span>
                    <span className="text-2xl font-extrabold text-sky-600">
                      {formatPrice(Number(booking.total_price))}
                    </span>
                  </div>
                  {booking.payment_date && (
                    <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 py-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã thanh toán ngày {formatDate(booking.payment_date)}
                    </div>
                  )}
                  {booking.payment_method && (
                    <p className="text-xs text-center text-slate-500">
                      Phương thức: <span className="font-medium text-sky-600">
                        {booking.payment_method === "stripe" ? "Thẻ (Stripe)" :
                         booking.payment_method === "vnpay" ? "VNPay" :
                         booking.payment_method === "bank_transfer" ? "Chuyển khoản" : booking.payment_method}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Button */}
              {canPay && (
                <Card className="border-sky-100">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-sky-500" />
                      Thanh toán ngay
                    </h3>
                    <PaymentSection booking={booking} onPaid={fetchBooking} />
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card className="border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-slate-800 mb-4">Thao tác</h3>

                  <Link href="/chat" className="block">
                    <Button variant="outline" className="w-full gap-2 border-sky-200 text-sky-600 hover:bg-sky-50">
                      <MessageSquare className="w-4 h-4" />
                      Nhắn hỗ trợ
                    </Button>
                  </Link>

                  <Link href={`/tours/${booking.tour?.slug}`} className="block">
                    <Button variant="outline" className="w-full gap-2 border-slate-200">
                      <RefreshCw className="w-4 h-4" />
                      Đặt lại tour này
                    </Button>
                  </Link>

                  {canCancel && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                      onClick={() => setCancelModal(true)}
                      disabled={cancelling}
                    >
                      <X className="w-4 h-4" />
                      Hủy đặt tour
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Support */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Hỗ trợ 24/7</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Đội ngũ TravelGPT luôn sẵn sàng hỗ trợ bạn mọi lúc.
                  </p>
                  <p className="text-sky-600 font-semibold mt-2">1900 1234</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Modal */}
      <CancelModal
        booking={booking}
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-500">Đang tải...</p>
        </div>
      </div>
    }>
      <BookingDetailContent />
    </Suspense>
  );
}
