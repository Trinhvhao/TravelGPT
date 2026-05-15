"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { Search, Loader2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 20, total_pages: 1 });

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", "20");
      if (statusFilter) params.set("status", statusFilter);

      const response = await api.get(`/bookings/admin/all?${params.toString()}`);
      setBookings(response.data.bookings);
      setPagination(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await api.put(`/bookings/admin/${bookingId}`, { status });
      toast.success("Cập nhật trạng thái thành công");
      fetchBookings();
    } catch (error) {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/confirm-payment`);
      toast.success("Xác nhận thanh toán thành công");
      fetchBookings();
    } catch (error) {
      toast.error("Xác nhận thất bại");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: "warning" as const, label: "Đang chờ" },
      CONFIRMED: { variant: "success" as const, label: "Đã xác nhận" },
      CANCELLED: { variant: "destructive" as const, label: "Đã hủy" },
      COMPLETED: { variant: "secondary" as const, label: "Hoàn thành" },
    };
    return variants[status] || { variant: "outline" as const, label: status };
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, any> = {
      UNPAID: { variant: "warning" as const, label: "Chưa thanh toán" },
      PAID: { variant: "success" as const, label: "Đã thanh toán" },
      REFUNDED: { variant: "secondary" as const, label: "Đã hoàn tiền" },
    };
    return variants[status] || { variant: "outline" as const, label: status };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Bookings</h1>
        <p className="text-muted-foreground">Quản lý đơn đặt tour</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="border rounded-md px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy đơn đặt tour nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4">Mã booking</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Tour</th>
                    <th className="p-4">Ngày đặt</th>
                    <th className="p-4">Tổng tiền</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Thanh toán</th>
                    <th className="p-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking: any) => {
                    const statusInfo = getStatusBadge(booking.status);
                    const paymentInfo = getPaymentBadge(booking.payment_status);

                    return (
                      <tr key={booking.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <span className="font-mono font-semibold">{booking.booking_code}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{booking.contact_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.contact_email}</p>
                          <p className="text-sm text-muted-foreground">{booking.contact_phone}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{booking.tour?.name || "Tour đã xóa"}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.num_adults} NL, {booking.num_children} TE
                          </p>
                        </td>
                        <td className="p-4">
                          <p>{formatDate(booking.created_at)}</p>
                          {booking.departure_date && (
                            <p className="text-sm text-muted-foreground">
                              Khởi hành: {formatDate(booking.departure_date)}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold">{formatPrice(Number(booking.total_price))}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            {booking.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                                  className="gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  Xác nhận
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                                  className="gap-1 text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                  Hủy
                                </Button>
                              </>
                            )}
                            {booking.status === "CONFIRMED" && booking.payment_status === "UNPAID" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConfirmPayment(booking.id)}
                              >
                                Xác nhận TT
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {page} / {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={page === pagination.total_pages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
