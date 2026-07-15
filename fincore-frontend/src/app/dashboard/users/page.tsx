"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { userService } from "@/services/user";
import { authService } from "@/services/auth";
import {
  Users,
  Search,
  UserPlus,
  X,
  Copy,
  Check,
  Lock,
  Unlock,
  Shield,
  User as UserIcon,
  Edit,
  KeyRound,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-2xl border border-zinc-150 shadow-2xl p-6 bg-white",
    title: "text-lg font-bold text-zinc-950",
    htmlContainer: "text-sm text-zinc-500 mt-2",
    confirmButton: "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors border-0 focus:ring-2 focus:ring-emerald-600/35 mx-2 cursor-pointer",
    cancelButton: "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors mx-2 cursor-pointer",
  },
  buttonsStyling: false,
});

// Form Schema
const createUserSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải từ 2 ký tự trở lên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  role: z.string().min(1, "Vui lòng chọn vai trò"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const mockUsers: User[] = [
  { id: "1", fullName: "Nguyễn Văn A", email: "admin@fincore.com", phone: "0901234567", role: "Admin", isActive: true, createdAt: "2026-06-01" },
  { id: "2", fullName: "Trần Thị B", email: "member1@fincore.com", phone: "0987654321", role: "Member", isActive: true, createdAt: "2026-06-10" },
  { id: "3", fullName: "Phạm Văn C", email: "member2@fincore.com", phone: "0912345678", role: "Member", isActive: false, createdAt: "2026-06-12" },
  { id: "4", fullName: "Lê Hoàng D", email: "member3@fincore.com", phone: "0933445566", role: "Member", isActive: true, createdAt: "2026-06-15" },
];

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    setIsLoaded(true);
  }, []);

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  
  // Drawer & Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Provisioning Result Modal
  const [provisionedAccount, setProvisionedAccount] = useState<{
    email: string;
    isReset?: boolean;
  } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "2", // Default to Member
    },
  });

  // Fetch from API on load if possible
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await userService.getUsers();
        if (userList && userList.length > 0) {
          setUsers(
            userList.map((u: any) => ({
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              phone: u.phone,
              role: u.role === "Admin" || u.role === 1 ? "Admin" : "Member",
              isActive: u.isActive,
              createdAt: u.createdAt ? u.createdAt.split("T")[0] : "",
            }))
          );
        }
      } catch (err) {
        console.log("Using local mock users fallback.");
      }
    };
    fetchUsers();
  }, []);

  const openCreateDrawer = () => {
    setEditingUser(null);
    reset({
      fullName: "",
      email: "",
      phone: "",
      role: "2",
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (user: User) => {
    setEditingUser(user);
    reset({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      role: user.role === "Admin" ? "1" : "2",
    });
    setIsDrawerOpen(true);
  };

  // Handle form submit (Create or Update)
  const onFormSubmit = async (values: CreateUserFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingUser) {
        // Update user
        await userService.updateUser(editingUser.id, {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          role: parseInt(values.role),
        });

        setUsers(
          users.map((u) => {
            if (u.id === editingUser.id) {
              return {
                ...u,
                fullName: values.fullName,
                email: values.email,
                phone: values.phone,
                role: parseInt(values.role) === 1 ? "Admin" : "Member",
              };
            }
            return u;
          })
        );
        showToast("Cập nhật thông tin thành viên thành công!");
        setIsDrawerOpen(false);
      } else {
        // Create user
        const response = await userService.createUser({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          role: parseInt(values.role),
        });

        setProvisionedAccount({
          email: response.email,
        });

        const newUser: User = {
          id: response.userId,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          role: parseInt(values.role) === 1 ? "Admin" : "Member",
          isActive: true,
          createdAt: new Date().toISOString().split("T")[0],
        };
        setUsers([newUser, ...users]);
        showToast("Cấp tài khoản mới thành công!");
        setIsDrawerOpen(false);
      }
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Thao tác thất bại.");
    } finally {
      setIsLoading(false);
    }
  };


  // Toggle user lock/unlock status
  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    MySwal.fire({
      title: newActive ? "Mở khóa tài khoản?" : "Khóa tài khoản?",
      text: newActive 
        ? "Bạn có chắc muốn mở khóa hoạt động cho tài khoản này?" 
        : "Bạn có chắc muốn tạm khóa tài khoản thành viên này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: newActive ? "Đồng ý mở" : "Đồng ý khóa",
      cancelButtonText: "Hủy bỏ",
      iconColor: newActive ? "#10B981" : "#EF4444",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await userService.toggleLockUser(userId, newActive);
          setUsers(
            users.map((u) => {
              if (u.id === userId) {
                return { ...u, isActive: newActive };
              }
              return u;
            })
          );
          showToast(newActive ? "Đã mở khóa tài khoản!" : "Đã khóa tài khoản thành viên!");
        } catch (err) {
          showToast("Thay đổi trạng thái tài khoản thất bại.", "error");
        }
      }
    });
  };

  // Filtered Users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-zinc-50/50">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-6 bg-red-50 text-red-700 rounded-3xl border border-red-200/50 shadow-sm max-w-md">
          <p className="font-bold text-sm">Truy cập bị từ chối</p>
          <p className="text-xs text-red-500 mt-1">Bạn không có quyền hạn quản trị để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-9 font-sans max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-600" />
            Quản lý thành viên
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Cấp tài khoản mới, phân quyền và khóa/mở khóa tài khoản thành viên trong câu lạc bộ.
          </p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Cấp tài khoản mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white border border-zinc-200/50 p-5 rounded-3xl shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo họ tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
        >
          <option value="All">Tất cả vai trò</option>
          <option value="Admin">Quản lý (Admin)</option>
          <option value="Member">Thành viên (Member)</option>
        </select>
      </div>

      {/* Users DataTable */}
      <div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50">
                <th className="p-4 pl-7">Họ và tên</th>
                <th className="p-4">Địa chỉ Email</th>
                <th className="p-4">Số điện thoại</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 pr-7 text-right">Quản trị viên</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-100/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="p-4 pl-7 font-bold text-zinc-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all duration-200">
                      <UserIcon className="w-4.5 h-4.5" />
                    </div>
                    {u.fullName}
                  </td>
                  <td className="p-4 text-zinc-500 font-medium">{u.email}</td>
                  <td className="p-4 text-zinc-450 font-medium">{u.phone || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === "Admin"
                          ? "bg-amber-50 text-amber-700 border border-amber-250/20"
                          : "bg-blue-50 text-blue-700 border border-blue-250/20"
                      }`}
                    >
                      {u.role === "Admin" && <Shield className="w-3.5 h-3.5" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-250/20"
                          : "bg-red-50 text-red-700 border border-red-250/20"
                      }`}
                    >
                      {u.isActive ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td className="p-4 pr-7 text-right">
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => openEditDrawer(u)}
                        className="bg-zinc-50 hover:bg-zinc-150 text-zinc-700 border border-zinc-200/60 p-2 rounded-xl transition-all active:scale-90 cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`p-2 rounded-xl border transition-all active:scale-90 cursor-pointer ${
                          u.isActive
                            ? "bg-red-50 border-red-200 text-red-650 hover:bg-red-100"
                            : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        }`}
                        title={u.isActive ? "Khóa tài khoản" : "Mở khóa"}
                      >
                        {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 font-semibold">
                    Không tìm thấy thành viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Right Drawer for Creation Form */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm transition-opacity"
          ></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-zinc-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-emerald-600" />
                      {editingUser ? "Cập nhật tài khoản" : "Cấp tài khoản thành viên"}
                    </h3>
                    <p className="text-xs text-zinc-450 mt-0.5">
                      {editingUser ? "Thay đổi hồ sơ thành viên" : "Cấp mật khẩu tạm thời cho người dùng"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Họ và tên thành viên
                    </label>
                    <input
                      type="text"
                      disabled={isLoading}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      {...register("fullName")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold"
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs text-red-655 font-semibold">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      disabled={isLoading || !!editingUser}
                      placeholder="member@fincore.com"
                      {...register("email")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold disabled:opacity-60"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-655 font-semibold">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Số điện thoại (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      disabled={isLoading}
                      placeholder="09XXXXXXXX"
                      {...register("phone")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Vai trò phân quyền
                    </label>
                    <select
                      disabled={isLoading}
                      {...register("role")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                    >
                      <option value="2">Thành viên (Member)</option>
                      <option value="1">Quản lý (Admin)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? "Đang xử lý..." : editingUser ? "Lưu thay đổi" : "Cấp tài khoản & Sinh mật khẩu"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provisioning Result Modal */}
      {provisionedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-zinc-200/60 rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-250">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Check className="w-6 h-6" />
              </div>
              
              <h3 className="text-base font-extrabold text-zinc-950">
                Cấp tài khoản thành công!
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tài khoản đã được khởi tạo thành công trên hệ thống. Vì lý do bảo mật, mật khẩu tạm thời đã được tự động gửi trực tiếp đến hòm thư của thành viên.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="mt-5 bg-zinc-50 border border-zinc-200/60 rounded-2xl p-4 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Tên tài khoản (Email)</span>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">{provisionedAccount.email}</p>
              </div>
              <div className="border-t border-zinc-150 pt-2.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Trạng thái thông báo</span>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Đã gửi email mật khẩu tạm thành công
                </p>
              </div>
            </div>

            {/* Button Actions */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setProvisionedAccount(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl text-sm transition-colors cursor-pointer active:scale-95 shadow-lg shadow-emerald-600/10"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed top-24 right-6 lg:right-10 z-[9999] flex items-center gap-2 px-5 py-3.5 rounded-2xl border text-sm font-bold shadow-2xl transition-all duration-300 animate-in slide-in-from-top-5 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-255 text-emerald-800 shadow-emerald-600/5"
              : "bg-red-50 border-red-255 text-red-800 shadow-red-650/5"
          }`}
        >
          <CheckCircle className={`w-5 h-5 shrink-0 ${toast.type === "success" ? "text-emerald-600" : "text-red-500"}`} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
