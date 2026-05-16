"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Loader2,
  Shield,
  User,
  Search,
  X,
  Edit2,
  ToggleRight,
  ToggleLeft,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

// ─── Edit Role Modal ───────────────────────────────────────────────────────
function EditRoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${user.id}/role?role=${role}`);
      toast.success("Cập nhật vai trò thành công");
      onSuccess();
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm animate-[slide-up_0.3s_ease-out]"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-[18px] text-[#000E1A]">Chỉnh sửa vai trò</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center hover:bg-[#DDDDDD] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[#636363]" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-[#F7F7F7]">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, #0391FF)` }}>
            {getInitials(user.full_name)}
          </div>
          <div>
            <p className="font-bold text-[15px] text-[#000E1A]">{user.full_name}</p>
            <p className="text-[13px] text-[#636363]">{user.email}</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-6">
          <label className="text-[14px] font-semibold text-[#000E1A]">Vai trò</label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
              className="w-full h-12 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] cursor-pointer bg-white appearance-none"
            >
              <option value="USER">Người dùng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636363] pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-3">
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
            onClick={handleSubmit}
            disabled={loading}
            style={{ borderRadius: "12px", backgroundColor: PRIMARY }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState<UserRecord | undefined>(undefined);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      let data: UserRecord[] = Array.isArray(response.data) ? response.data : response.data?.users ?? [];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.includes(q)
        );
      }
      if (roleFilter) {
        data = data.filter((u) => u.role === roleFilter);
      }
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await api.put(`/users/${userId}/role?role=${role}`);
      toast.success("Cập nhật vai trò thành công");
      fetchUsers();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    try {
      await api.put(`/users/${user.id}/status?is_active=${!user.is_active}`);
      toast.success(user.is_active ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      fetchUsers();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#000E1A]">Quản lý Users</h1>
        <p className="text-sm text-[#636363] mt-0.5">
          {users.length > 0 ? `${users.length} người dùng` : "Tất cả người dùng hệ thống"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 px-4 rounded-xl border border-[#DDDDDD] text-[14px] focus:outline-none focus:border-[#0046C1] bg-white cursor-pointer"
        >
          <option value="">Tất cả vai trò</option>
          <option value="USER">Người dùng</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border border-[#DDDDDD] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
              <tr>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Người dùng</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Vai trò</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Trạng thái</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Ngày tham gia</th>
                <th className="p-4 text-left text-[12px] font-bold text-[#636363]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0046C1]" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#636363]">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors"
                  >
                    {/* Avatar + Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${PRIMARY}, #0391FF)` }}
                        >
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[14px] text-[#000E1A]">{user.full_name}</p>
                          <p className="text-[12px] text-[#636363]">{user.email}</p>
                          {user.phone && (
                            <p className="text-[12px] text-[#636363]">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <Badge
                        variant={user.role === "ADMIN" ? "default" : "secondary"}
                        className="text-[12px] gap-1"
                        style={{
                          borderRadius: "20px",
                          backgroundColor: user.role === "ADMIN" ? "#EDE9FE" : "#F7F7F7",
                          color: user.role === "ADMIN" ? "#7C3AED" : "#636363",
                          border: "none",
                        }}
                      >
                        {user.role === "ADMIN" ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {user.role === "ADMIN" ? "Admin" : "User"}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {user.is_active ? (
                        <Badge
                          variant="success"
                          className="text-[12px]"
                          style={{ borderRadius: "20px" }}
                        >
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="text-[12px]"
                          style={{ borderRadius: "20px" }}
                        >
                          Bị khóa
                        </Badge>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="p-4">
                      <p className="text-[13px] text-[#636363]">
                        {formatDate(user.created_at)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Edit role */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="w-8 h-8 rounded-lg bg-[#D9EEFF] flex items-center justify-center hover:bg-[#BFDBFE] transition-colors cursor-pointer"
                          title="Chỉnh sửa vai trò"
                        >
                          <Edit2 className="w-4 h-4" style={{ color: PRIMARY }} />
                        </button>

                        {/* Toggle status */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                          style={{
                            backgroundColor: user.is_active ? "#FEF2F2" : "#DCFCE7",
                          }}
                        >
                          {user.is_active ? (
                            <ToggleLeft className="w-5 h-5 text-[#DC2626]" />
                          ) : (
                            <ToggleRight className="w-5 h-5 text-[#059669]" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Modal */}
      {editingUser && (
        <EditRoleModal
          user={editingUser}
          onClose={() => setEditingUser(undefined)}
          onSuccess={() => { setEditingUser(undefined); fetchUsers(); }}
        />
      )}
    </div>
  );
}
