"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  ToggleRight,
  ToggleLeft,
  X,
  MapPin,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

interface Tour {
  id: string;
  name: string;
  slug: string;
  destination: string;
  region?: string;
  duration: string;
  price: number;
  discount_price?: number;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  rating: number;
  review_count: number;
  category?: string;
}

// ─── Add/Edit Tour Modal ──────────────────────────────────────────────────────
function TourModal({
  tour,
  onClose,
  onSuccess,
}: {
  tour?: Tour;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: tour?.name ?? "",
    slug: tour?.slug ?? "",
    destination: tour?.destination ?? "",
    duration: tour?.duration ?? "",
    price: String(tour?.price ?? ""),
    discount_price: String(tour?.discount_price ?? ""),
    region: tour?.region ?? "NORTH",
    is_featured: tour?.is_featured ?? false,
    is_active: tour?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.destination) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        destination: form.destination,
        duration: form.duration,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        is_featured: form.is_featured,
        is_active: form.is_active,
        region: form.region,
      };
      if (tour) {
        await api.put(`/tours/${tour.id}`, payload);
      } else {
        await api.post("/tours", payload);
      }
      toast.success(tour ? "Cập nhật tour thành công" : "Thêm tour mới thành công");
      onSuccess();
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div
        className="w-full max-w-xl bg-white shadow-elevated flex flex-col animate-slide-in-right"
        style={{ maxHeight: "100vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
          <h2 className="font-bold text-[18px] text-[#000E1A]">
            {tour ? "Chỉnh sửa Tour" : "Thêm Tour mới"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F7F7F7] flex items-center justify-center hover:bg-[#DDDDDD] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-[#636363]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {[
            { key: "name", label: "Tên tour *", placeholder: "VD: Tour Đà Nẵng 3N2Đ" },
            { key: "destination", label: "Điểm đến *", placeholder: "VD: Đà Nẵng" },
            { key: "duration", label: "Thời gian", placeholder: "VD: 3N2Đ" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[14px] font-semibold text-[#000E1A]">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={String(form[key as keyof typeof form])}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1]"
              />
            </div>
          ))}

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "price", label: "Giá gốc (VNĐ) *", placeholder: "2000000" },
              { key: "discount_price", label: "Giá giảm (VNĐ)", placeholder: "1800000" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[14px] font-semibold text-[#000E1A]">{label}</label>
                <input
                  type="number"
                  placeholder={placeholder}
                  value={String(form[key as keyof typeof form])}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1]"
                />
              </div>
            ))}
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-[#000E1A]">Miền</label>
            <select
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] cursor-pointer bg-white"
            >
              <option value="NORTH">Miền Bắc</option>
              <option value="CENTRAL">Miền Trung</option>
              <option value="SOUTH">Miền Nam</option>
              <option value="INTERNATIONAL">Quốc tế</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "is_featured", label: "Tour nổi bật", active: form.is_featured },
              { key: "is_active", label: "Hiển thị", active: form.is_active },
            ].map(({ key, label, active }) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 rounded-xl border border-[#EEEEEE] cursor-pointer"
                onClick={() => setForm((f) => ({ ...f, [key]: !active }))}
              >
                <span className="text-[14px] font-medium text-[#000E1A]">{label}</span>
                {active ? (
                  <ToggleRight className="w-8 h-8 text-[#0046C1]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#DDDDDD]" />
                )}
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-[#EEEEEE] flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={onClose}
            style={{ borderRadius: "12px", borderColor: "#DDDDDD" }}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 h-12 text-white"
            type="button"
            onClick={() => { const e = { preventDefault: () => {} } as unknown as React.FormEvent; handleSubmit(e); }}
            disabled={loading}
            style={{ borderRadius: "12px", backgroundColor: PRIMARY }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : tour ? "Lưu thay đổi" : "Thêm tour"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [regionFilter, setRegionFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | undefined>(undefined);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", "20");
      if (search) params.set("search", search);
      if (regionFilter) params.set("region", regionFilter);

      const response = await api.get(`/tours?${params.toString()}`);
      setTours(response.data?.tours ?? []);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.total_pages ?? 1);
    } catch (error) {
      console.error("Failed to fetch tours:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTours(); }, [page, search, regionFilter]);

  const handleDelete = async (tourId: string) => {
    if (!confirm("Bạn có chắc muốn xóa tour này?")) return;
    try {
      await api.delete(`/tours/${tourId}`);
      toast.success("Xóa tour thành công");
      fetchTours();
    } catch {
      toast.error("Xóa tour thất bại");
    }
  };

  const handleToggleFeatured = async (tour: Tour) => {
    try {
      await api.put(`/tours/${tour.id}`, { is_featured: !tour.is_featured });
      toast.success("Cập nhật thành công");
      fetchTours();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleToggleActive = async (tour: Tour) => {
    try {
      await api.put(`/tours/${tour.id}`, { is_active: !tour.is_active });
      toast.success(tour.is_active ? "Đã ẩn tour" : "Đã hiển thị tour");
      fetchTours();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const openAdd = () => { setEditingTour(undefined); setShowModal(true); };
  const openEdit = (tour: Tour) => { setEditingTour(tour); setShowModal(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#000E1A]">Quản lý Tours</h1>
          <p className="text-sm text-[#636363] mt-0.5">
            {total > 0 ? `${total.toLocaleString()} tour` : "Tất cả tour du lịch"}
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 text-white"
          style={{ borderRadius: "12px", backgroundColor: PRIMARY }}
        >
          <Plus className="w-4 h-4" />
          Thêm Tour mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            placeholder="Tìm theo tên tour, điểm đến..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#DDDDDD] hover:bg-[#999999] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Region filter */}
        <select
          value={regionFilter}
          onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
          className="h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] bg-white cursor-pointer"
        >
          <option value="">Tất cả miền</option>
          <option value="NORTH">Miền Bắc</option>
          <option value="CENTRAL">Miền Trung</option>
          <option value="SOUTH">Miền Nam</option>
          <option value="INTERNATIONAL">Quốc tế</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border border-[#DDDDDD] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
              <tr>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Tour</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Miền</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Giá</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Nổi bật</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Hiển thị</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0046C1]" />
                  </td>
                </tr>
              ) : tours.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#636363]">
                    Không tìm thấy tour nào
                  </td>
                </tr>
              ) : (
                tours.map((tour) => (
                  <tr
                    key={tour.id}
                    className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {tour.images?.[0] && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={typeof tour.images[0] === "string"
                                ? tour.images[0]
                                : (tour.images[0] as { url: string }).url}
                              alt={tour.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[14px] text-[#000E1A] line-clamp-1 max-w-[200px]">
                            {tour.name}
                          </p>
                          <p className="text-[12px] text-[#636363] flex items-center gap-1">
                            <MapPin className="w-3 h-3" style={{ color: PRIMARY }} />
                            {tour.destination} · {tour.duration}
                          </p>
                          {tour.rating > 0 && (
                            <p className="text-[12px] text-[#636363] flex items-center gap-1">
                              <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                              {tour.rating.toFixed(1)} ({tour.review_count} đánh giá)
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className="text-[12px]"
                        style={{ borderRadius: "20px", borderColor: "#D9EEFF", color: PRIMARY, backgroundColor: "#D9EEFF" }}
                      >
                        {{
                          NORTH: "Miền Bắc",
                          CENTRAL: "Miền Trung",
                          SOUTH: "Miền Nam",
                          INTERNATIONAL: "Quốc tế",
                        }[tour.region ?? "NORTH"] ?? tour.region}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div>
                        {tour.discount_price && tour.discount_price < tour.price ? (
                          <>
                            <p className="text-[12px] text-[#636363] line-through">
                              {formatPrice(tour.price)}
                            </p>
                            <p className="font-bold text-[15px]" style={{ color: PRIMARY }}>
                              {formatPrice(Number(tour.discount_price))}
                            </p>
                          </>
                        ) : (
                          <p className="font-bold text-[15px]" style={{ color: PRIMARY }}>
                            {formatPrice(Number(tour.price))}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleFeatured(tour)}
                        title={tour.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                        className="transition-opacity hover:opacity-70 cursor-pointer"
                      >
                        {tour.is_featured ? (
                          <ToggleRight className="w-8 h-8 text-[#0046C1]" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-[#DDDDDD]" />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(tour)}
                        title={tour.is_active ? "Ẩn tour" : "Hiển thị tour"}
                        className="transition-opacity hover:opacity-70 cursor-pointer"
                      >
                        {tour.is_active ? (
                          <Badge variant="success" className="text-[12px]" style={{ borderRadius: "20px" }}>
                            Hiển thị
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[12px]" style={{ borderRadius: "20px" }}>
                            Đã ẩn
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(tour)}
                          className="w-8 h-8 rounded-lg bg-[#D9EEFF] flex items-center justify-center hover:bg-[#BFDBFE] transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" style={{ color: PRIMARY }} />
                        </button>
                        <button
                          onClick={() => handleDelete(tour.id)}
                          className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center hover:bg-[#FECACA] transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-[#DC2626]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Modal */}
      {showModal && (
        <TourModal
          tour={editingTour}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchTours(); }}
        />
      )}
    </div>
  );
}
