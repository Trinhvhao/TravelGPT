"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/stores";
import { formatPrice } from "@/lib/utils";
import { calculatePrice } from "@/types/booking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks";
import { showToast } from "@/components/ui/toast";
import { bookingApi } from "@/lib/booking-api";
import { Spinner } from "@/components/ui/spinner";
import { Minus, Plus, CheckCircle } from "lucide-react";
import type { Tour } from "@/types";

interface BookingFormProps {
  tour: Tour;
  onSuccess?: (bookingCode: string, bookingId: string) => void;
}

interface FormData {
  departure_date: string;
  num_adults: number;
  num_children: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  special_requests: string;
}

const STEPS = ["Ngày & Số người", "Thông tin liên hệ", "Xác nhận"] as const;
type Step = typeof STEPS[number];

export function BookingForm({ tour, onSuccess }: BookingFormProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isActive, startFlow } = useBookingStore();

  const [step, setStep] = useState<Step>(STEPS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const price = calculatePrice(tour.price, numAdults, numChildren);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      departure_date: "",
      num_adults: 1,
      num_children: 0,
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      special_requests: "",
    },
  });

  const validateStep1 = () => {
    const date = getValues("departure_date");
    if (!date) return "Vui lòng chọn ngày khởi hành.";
    if (new Date(date) < new Date()) return "Ngày khởi hành phải là ngày trong tương lai.";
    return null;
  };

  const validateStep2 = () => {
    const name = getValues("contact_name");
    const email = getValues("contact_email");
    const phone = getValues("contact_phone");
    if (!name?.trim()) return "Vui lòng nhập họ tên.";
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ.";
    if (!phone?.trim() || !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone.replace(/\s/g, ""))) {
      return "Số điện thoại không hợp lệ.";
    }
    return null;
  };

  const nextStep = () => {
    const idx = STEPS.indexOf(step);
    if (step === STEPS[0]) {
      const err = validateStep1();
      if (err) { showToast.error("Lỗi", err); return; }
    }
    if (step === STEPS[1]) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/tours/${tour.slug}`);
        return;
      }
      const err = validateStep2();
      if (err) { showToast.error("Lỗi", err); return; }
    }
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const prevStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const data = getValues();
      const booking = await bookingApi.create({
        tour_id: tour.id,
        num_adults: data.num_adults,
        num_children: data.num_children,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        departure_date: data.departure_date,
        special_requests: data.special_requests || undefined,
      });

      setBookingCode(booking.booking_code);
      setStep("Xác nhận" as Step); // completed
      startFlow();
      showToast.success("Đặt tour thành công!", `Mã booking: ${booking.booking_code}`);
      onSuccess?.(booking.booking_code, booking.id);
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.toLowerCase().includes("overbook")) {
        showToast.error("Hết chỗ", "Tour này đã hết slot cho ngày bạn chọn.");
      } else {
        showToast.error("Lỗi", msg || "Không thể tạo booking. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Completed state
  if (bookingCode) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-success mx-auto" />
        <h3 className="text-heading-2 font-bold text-navy">Đặt tour thành công!</h3>
        <div className="space-y-2">
          <p className="text-body-sm text-dark-gray">Mã booking của bạn</p>
          <p className="font-mono font-bold text-xl text-primary tracking-widest">
            {bookingCode}
          </p>
        </div>
        <p className="text-body-sm text-dark-gray">
          Vui lòng thanh toán trong vòng 24h để xác nhận chỗ.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="secondary" onClick={() => router.push("/bookings")}>
            Xem danh sách
          </Button>
          <Button onClick={() => router.push(`/bookings?code=${bookingCode}`)}>
            Thanh toán
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-border">
        {STEPS.map((s, idx) => {
          const isCurrent = s === step;
          const isPast = STEPS.indexOf(step) > idx;
          return (
            <div
              key={s}
              className={cn(
                "flex-1 py-3 text-center text-body-sm font-medium transition-colors",
                isCurrent && "bg-primary/5 text-primary border-b-2 border-primary",
                isPast && "text-success",
                !isCurrent && !isPast && "text-medium-gray"
              )}
            >
              {s}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="p-6 space-y-5">
        {/* Step 1: Date + Participants */}
        {step === STEPS[0] && (
          <>
            <div className="space-y-1.5">
              <Label>Ngày khởi hành</Label>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                error={!!errors.departure_date}
                {...register("departure_date", { required: "Vui lòng chọn ngày" })}
              />
              {errors.departure_date && (
                <p className="text-error text-metadata">{errors.departure_date.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Người lớn</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNumAdults((n) => Math.max(1, n - 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-lightest-gray transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{numAdults}</span>
                  <button
                    type="button"
                    onClick={() => setNumAdults((n) => Math.min(tour.max_participants, n + 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-lightest-gray transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-metadata text-dark-gray">{formatPrice(tour.price)}/người</p>
              </div>

              <div className="space-y-1.5">
                <Label>Trẻ em (50%)</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNumChildren((n) => Math.max(0, n - 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-lightest-gray transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{numChildren}</span>
                  <button
                    type="button"
                    onClick={() => setNumChildren((n) => Math.min(tour.max_participants - numAdults, n + 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-lightest-gray transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-metadata text-dark-gray">{formatPrice(tour.price * 0.5)}/trẻ</p>
              </div>
            </div>

            <div className="rounded-md bg-lightest-gray p-4 space-y-1.5 text-right">
              <div className="flex justify-between text-body-sm">
                <span className="text-dark-gray">Tổng cộng</span>
                <span className="font-bold text-primary">{formatPrice(price.total)}</span>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Contact Info */}
        {step === STEPS[1] && (
          <>
            <div className="space-y-1.5">
              <Label>Họ tên <span className="text-error">*</span></Label>
              <Input
                placeholder="Nguyễn Văn A"
                error={!!errors.contact_name}
                {...register("contact_name", { required: "Vui lòng nhập họ tên" })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-error">*</span></Label>
              <Input
                type="email"
                placeholder="email@example.com"
                error={!!errors.contact_email}
                {...register("contact_email", {
                  required: "Vui lòng nhập email",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" },
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại <span className="text-error">*</span></Label>
              <Input
                type="tel"
                placeholder="0912 345 678"
                error={!!errors.contact_phone}
                {...register("contact_phone", {
                  required: "Vui lòng nhập số điện thoại",
                  pattern: { value: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: "Số điện thoại không hợp lệ" },
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yêu cầu đặc biệt</Label>
              <Textarea
                placeholder="VD: ăn chay, cần xe lăn, dị ứng thực phẩm..."
                helperText="Không bắt buộc. Tối đa 500 ký tự."
                {...register("special_requests")}
              />
            </div>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === STEPS[2] && (
          <div className="space-y-3">
            <p className="text-body-sm text-dark-gray">Vui lòng kiểm tra thông tin trước khi xác nhận:</p>
            <div className="rounded-md border border-border p-4 space-y-2 text-body-sm">
              <div className="flex justify-between">
                <span className="text-dark-gray">Tour</span>
                <span className="font-semibold text-navy">{tour.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-gray">Ngày</span>
                <span>{getValues("departure_date")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-gray">Người lớn</span>
                <span>{getValues("num_adults")} × {formatPrice(tour.price)}</span>
              </div>
              {getValues("num_children") > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-gray">Trẻ em</span>
                  <span>{getValues("num_children")} × {formatPrice(tour.price * 0.5)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-primary pt-2 border-t">
                <span>Tổng cộng</span>
                <span>{formatPrice(price.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step !== STEPS[0] && (
            <Button variant="secondary" onClick={prevStep}>
              Quay lại
            </Button>
          )}
          {step !== STEPS[2] ? (
            <Button className="flex-1" onClick={nextStep}>
              Tiếp tục
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? <><Spinner size="sm" /> Đang xử lý...</> : "Xác nhận đặt tour"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
