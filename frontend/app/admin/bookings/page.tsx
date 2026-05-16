"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Search,
  Loader2,
  Check,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Eye,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

interface Booking {
  id: string;
  booking_code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  departure_date?: string;
  num_adults: number;
  num_children: number;
  total_price: string;
  status: string;
  payment_status: string;
  created_at: string;
  tour?: {
    id: string;
    name: string;
    destination?: string;
    duration?: string;
    images?: string[];
  };
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "warning" | "success" | "destructive" | "secondary" | "outline"; label: string }> = {
    PENDING: { variant: "warning", label: "Đang chờ" },
    CONFIRMED: { variant: "success", label: "Đã xác nhận" },
    CANCELLED: { variant: "destructive", label: "Đã hủy" },
    COMPLETED: { variant: "secondary", label: "Hoàn thành" },
  };
  return variants[status] ?? { variant: "outline", label: status };
}

function getPaymentBadge(status: string) {
  const variants: Record<string, { variant: "warning" | "success" | "secondary" | "outline"; label: string }> = {
    UNPAID: { variant: "warning", label: "Chưa thanh toán" },
    PAID: { variant: "success", label: "Đã thanh toán" },
    REFUNDED: { variant: "secondary", label: "Đã hoàn tiền" },
  };
  return variants[status] ?? { variant: "outline", label: status };
}

// ─── Booking Detail Panel ─────────────────────────────────────────────────────
function BookingDetailPanel({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (status: string) => {
    setLoading(true);
    try {
      await api.put(`/bookings/admin/${booking.id}`, { status });
      toast.success(`Cập nhật thành công`);
      onClose();
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await api.put(`/bookings/${booking.id}/confirm-payment`);
      toast.success("Xác nhận thanh toán thành công");
      onClose();
    } catch {
      toast.error("Xác nhận thất bại");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = getStatusBadge(booking.status);
  const paymentInfo = getPaymentBadge(booking.payment_status);

  return (
    <div className="fixed inset-0 z-modal flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />
      {/* Panel */}
      <div
        className="w-full max-w-lg bg-white shadow-elevated flex flex-col animate-slide-in-right"
        style={{ maxHeight: "100vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b border-[#EEEEEE]"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{booking.booking_code}</p>
              <p className="text-white/70 text-sm">{formatDate(booking.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>
          </div>

          {/* Customer */}
          <div>
            <h3 className="font-bold text-[15px] text-[#000E1A] mb-3">Thông tin khách hàng</h3>
            <div className="space-y-2">
              {[
                { icon: MapPin, label: "Tên", value: booking.contact_name },
                { icon: Mail, label: "Email", value: booking.contact_email },
                { icon: Phone, label: "Điện thoại", value: booking.contact_phone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F7F7]">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                  <div>
                    <p className="text-[11px] text-[#636363]">{label}</p>
                    <p className="text-[14px] font-medium text-[#000E1A]">{value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tour */}
          {booking.tour && (
            <div>
              <h3 className="font-bold text-[15px] text-[#000E1A] mb-3">Thông tin tour</h3>
              <div className="rounded-xl border border-[#EEEEEE] overflow-hidden">
                {booking.tour.images?.[0] && (
                  <div className="h-32 overflow-hidden">
                    <img
                      src={typeof booking.tour.images[0] === "string"
                        ? booking.tour.images[0]
                        : (booking.tour.images[0] as { url: string }).url}
                      alt={booking.tour.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <p className="font-bold text-[15px] text-[#000E1A]">{booking.tour.name}</p>
                  {booking.tour.destination && (
                    <p className="text-[13px] text-[#636363] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                      {booking.tour.destination}
                    </p>
                  )}
                  {booking.tour.duration && (
                    <p className="text-[13px] text-[#636363] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                      {booking.tour.duration}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Booking details */}
          <div>
            <h3 className="font-bold text-[15px] text-[#000E1A] mb-3">Chi tiết đặt tour</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#636363]">Người lớn</span>
                <span className="font-semibold">{booking.num_adults}</span>
              </div>
              {booking.num_children > 0 && (
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#636363]">Trẻ em</span>
                  <span className="font-semibold">{booking.num_children}</span>
                </div>
              )}
              {booking.departure_date && (
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#636363]">Ngày khởi hành</span>
                  <span className="font-semibold">{formatDate(booking.departure_date)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#EEEEEE] flex justify-between">
                <span className="font-bold text-[15px] text-[#000E1A]">Tổng tiền</span>
                <span className="font-extrabold text-lg" style={{ color: PRIMARY }}>
                  {formatPrice(Number(booking.total_price))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#EEEEEE] space-y-3">
          {booking.status === "PENDING" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleConfirm("CANCELLED")}
                disabled={loading}
                style={{ borderRadius: "12px", borderColor: "#DDDDDD" }}
              >
                <X className="w-4 h-4 text-[#DC2626]" />
                Hủy đơn
              </Button>
              <Button
                className="flex-1 gap-2 text-white"
                onClick={() => handleConfirm("CONFIRMED")}
                disabled={loading}
                style={{ backgroundColor: PRIMARY, borderRadius: "12px" }}
              >
                <Check className="w-4 h-4" />
                Xác nhận
              </Button>
            </div>
          )}
          {booking.status === "CONFIRMED" && booking.payment_status === "UNPAID" && (
            <Button
              className="w-full gap-2 text-white"
              onClick={handleConfirmPayment}
              disabled={loading}
              style={{ backgroundColor: "#059669", borderRadius: "12px" }}
            >
              <CreditCard className="w-4 h-4" />
              Xác nhận thanh toán
            </Button>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-[14px] text-[#636363]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("payment_status", paymentFilter);

      const response = await api.get(`/bookings/admin/all?${params.toString()}`);
      let data = response.data?.bookings ?? [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter(
          (b: Booking) =>
            b.booking_code?.toLowerCase().includes(q) ||
            b.contact_name?.toLowerCase().includes(q) ||
            b.contact_email?.toLowerCase().includes(q) ||
            b.contact_phone?.includes(q) ||
            b.tour?.name?.toLowerCase().includes(q)
        );
      }
      setBookings(data);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.total_pages ?? 1);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, paymentFilter]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await api.put(`/bookings/admin/${bookingId}`, { status });
      toast.success("Cập nhật trạng thái thành công");
      fetchBookings();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/confirm-payment`);
      toast.success("Xác nhận thanh toán thành công");
      fetchBookings();
    } catch {
      toast.error("Xác nhận thất bại");
    }
  };

  const handleExportCSV = () => {
    setExporting(true);
    const headers = ["Mã", "Khách hàng", "Email", "Điện thoại", "Tour", "Ngày đặt", "Tổng tiền", "Trạng thái", "Thanh toán"];
    const rows = bookings.map((b) => [
      b.booking_code,
      b.contact_name,
      b.contact_email,
      b.contact_phone,
      b.tour?.name ?? "",
      formatDate(b.created_at),
      formatPrice(Number(b.total_price)),
      b.status,
      b.payment_status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success("Đã tải file CSV");
  };

  const handleBulkAction = async (action: "CONFIRMED" | "CANCELLED") => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      try {
        await api.put(`/bookings/admin/${id}`, { status: action });
      } catch {
        /* skip */
      }
    }
    toast.success(`Đã cập nhật ${selectedIds.size} đơn`);
    setSelectedIds(new Set());
    fetchBookings();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === bookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookings.map((b) => b.id)));
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPaymentFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const hasFilters = statusFilter || paymentFilter || searchQuery;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#000E1A]">Quản lý Bookings</h1>
          <p className="text-sm text-[#636363] mt-0.5">
            {total > 0 ? `${total.toLocaleString()} đơn đặt tour` : "Tất cả đơn đặt tour"}
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={exporting || bookings.length === 0}
          className="gap-2 text-white"
          style={{ backgroundColor: "#059669", borderRadius: "12px" }}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Xuất CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Tìm theo mã, tên, email, SĐT..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1]"
            style={{ backgroundColor: "#FFFFFF" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#DDDDDD] hover:bg-[#999999] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] bg-white cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>

        {/* Payment filter */}
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] bg-white cursor-pointer"
        >
          <option value="">Tất cả thanh toán</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="REFUNDED">Đã hoàn tiền</option>
        </select>

        {hasFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="h-11 gap-2 text-[14px]"
            style={{ borderRadius: "12px", borderColor: "#DDDDDD" }}
          >
            <RefreshCw className="w-4 h-4" />
            Xóa lọc
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EEF6FF] border border-[#BFDBFE]">
          <span className="text-[14px] font-medium text-[#0046C1]">
            Đã chọn {selectedIds.size} đơn
          </span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" onClick={() => handleBulkAction("CONFIRMED")} className="gap-1 text-white" style={{ backgroundColor: "#059669", borderRadius: "8px" }}>
              <Check className="w-3.5 h-3.5" /> Xác nhận
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("CANCELLED")} className="gap-1" style={{ borderRadius: "8px", borderColor: "#DC2626", color: "#DC2626" }}>
              <X className="w-3.5 h-3.5" /> Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="border border-[#DDDDDD] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={bookings.length > 0 && selectedIds.size === bookings.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-[#0046C1]"
                  />
                </th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Mã booking</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Khách hàng</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Tour</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Ngày đặt</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Tổng tiền</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Trạng thái</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Thanh toán</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0046C1]" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#636363]">
                    Không tìm thấy đơn đặt tour nào
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  const paymentInfo = getPaymentBadge(booking.payment_status);
                  const isSelected = selectedIds.has(booking.id);

                  return (
                    <tr
                      key={booking.id}
                      className={cn(
                        "border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors",
                        isSelected && "bg-[#EEF6FF]"
                      )}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(booking.id)}
                          className="w-4 h-4 cursor-pointer accent-[#0046C1]"
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-[13px] text-[#000E1A]">
                          {booking.booking_code}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-[13px] text-[#000E1A]">{booking.contact_name}</p>
                        <p className="text-[12px] text-[#636363]">{booking.contact_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-[13px] text-[#000E1A] line-clamp-1 max-w-[160px]">
                          {booking.tour?.name ?? "Tour đã xóa"}
                        </p>
                        <p className="text-[12px] text-[#636363]">
                          {booking.num_adults} NL, {booking.num_children} TE
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-[13px] text-[#000E1A]">{formatDate(booking.created_at)}</p>
                        {booking.departure_date && (
                          <p className="text-[12px] text-[#636363]">
                            Khởi hành: {formatDate(booking.departure_date)}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[14px]" style={{ color: PRIMARY }}>
                          {formatPrice(Number(booking.total_price))}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="w-8 h-8 rounded-lg bg-[#D9EEFF] flex items-center justify-center hover:bg-[#BFDBFE] transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" style={{ color: PRIMARY }} />
                          </button>
                          {booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                                className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center hover:bg-[#BBF7D0] transition-colors cursor-pointer"
                                title="Xác nhận"
                              >
                                <Check className="w-4 h-4 text-[#059669]" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                                className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center hover:bg-[#FECACA] transition-colors cursor-pointer"
                                title="Hủy đơn"
                              >
                                <X className="w-4 h-4 text-[#DC2626]" />
                              </button>
                            </>
                          )}
                          {booking.status === "CONFIRMED" && booking.payment_status === "UNPAID" && (
                            <button
                              onClick={() => handleConfirmPayment(booking.id)}
                              className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center hover:bg-[#BBF7D0] transition-colors cursor-pointer"
                              title="Xác nhận thanh toán"
                            >
                              <CreditCard className="w-4 h-4 text-[#059669]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#EEEEEE]">
            <p className="text-[13px] text-[#636363]">
              Trang {page} / {totalPages} · {total.toLocaleString()} kết quả
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ borderRadius: "8px" }}
              >
                Trước
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-[13px] font-bold transition-all cursor-pointer",
                    p === page
                      ? "text-white shadow-sm"
                      : "text-[#636363] hover:bg-[#F7F7F7]"
                  )}
                  style={p === page ? { backgroundColor: PRIMARY } : {}}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ borderRadius: "8px" }}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Panel */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          onClose={() => {
            setSelectedBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}
