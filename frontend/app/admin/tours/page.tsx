"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

interface Tour {
  id: string;
  name: string;
  slug: string;
  destination: string;
  duration: string;
  price: number;
  discount_price?: number;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  rating: number;
  review_count: number;
}

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 10, total_pages: 1 });

  useEffect(() => {
    fetchTours();
  }, [page]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", "10");
      if (search) params.set("search", search);

      const response = await api.get(`/tours?${params.toString()}`);
      setTours(response.data.tours);
      setPagination(response.data);
    } catch (error) {
      console.error("Failed to fetch tours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    if (!confirm("Bạn có chắc muốn xóa tour này?")) return;

    try {
      await api.delete(`/tours/${tourId}`);
      toast.success("Xóa tour thành công");
      fetchTours();
    } catch (error) {
      toast.error("Xóa tour thất bại");
    }
  };

  const handleToggleFeatured = async (tour: Tour) => {
    try {
      await api.put(`/tours/${tour.id}`, { is_featured: !tour.is_featured });
      toast.success("Cập nhật thành công");
      fetchTours();
    } catch (error) {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTours();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Tours</h1>
          <p className="text-muted-foreground">Quản lý danh sách tours</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm Tour mới
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <Input
          placeholder="Tìm kiếm tour..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Tìm kiếm
        </Button>
      </form>

      {/* Tours Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy tour nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4">Tour</th>
                    <th className="p-4">Điểm đến</th>
                    <th className="p-4">Giá</th>
                    <th className="p-4">Nổi bật</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((tour) => (
                    <tr key={tour.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {tour.images?.[0] && (
                            <img
                              src={tour.images[0]}
                              alt={tour.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{tour.name}</p>
                            <p className="text-sm text-muted-foreground">{tour.duration}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{tour.destination}</td>
                      <td className="p-4">
                        <div>
                          {tour.discount_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(tour.price)}
                            </span>
                          )}
                          <p className="font-semibold">
                            {formatPrice(Number(tour.discount_price || tour.price))}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleToggleFeatured(tour)}>
                          {tour.is_featured ? (
                            <ToggleRight className="h-6 w-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <Badge variant={tour.is_active ? "success" : "secondary"}>
                          {tour.is_active ? "Hoạt động" : "Ẩn"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(tour.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
