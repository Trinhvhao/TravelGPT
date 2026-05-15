"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Loader2, Shield, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role?role=${newRole}`);
      toast.success("Cập nhật quyền thành công");
      fetchUsers();
    } catch (error) {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/users/${userId}/status?is_active=${!isActive}`);
      toast.success("Cập nhật trạng thái thành công");
      fetchUsers();
    } catch (error) {
      toast.error("Cập nhật thất bại");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Users</h1>
        <p className="text-muted-foreground">Quản lý người dùng hệ thống</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.phone || "-"}</td>
                    <td className="p-4">
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role === "ADMIN" ? (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            User
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.is_active ? "success" : "destructive"}>
                        {user.is_active ? "Hoạt động" : "Bị khóa"}
                      </Badge>
                    </td>
                    <td className="p-4">{formatDate(user.created_at)}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {user.role === "USER" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRole(user.id, "ADMIN")}
                          >
                            Nâng cấp Admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRole(user.id, "USER")}
                          >
                            Hạ cấp User
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={user.is_active ? "destructive" : "outline"}
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? "Khóa" : "Mở khóa"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
