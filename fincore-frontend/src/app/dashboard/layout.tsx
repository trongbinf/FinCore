"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth";
import { UserSession } from "@/types/auth";
import {
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  History,
  Bell,
  Check,
  ChevronRight,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  Settings,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { systemService } from "@/services/system";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { name: "Quản lý thu chi", href: "/dashboard/transactions", icon: Receipt },
  { name: "Quản lý thành viên", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Báo cáo tài chính", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Nhật ký hoạt động", href: "/dashboard/logs", icon: History, adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Notification states
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Profile and Password states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<"info" | "password" | "system">("info");
  const [changePwdData, setChangePwdData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [changePwdError, setChangePwdError] = useState<string | null>(null);
  const [changePwdSuccess, setChangePwdSuccess] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });

  // System Reset states
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const adminNotis = [
    { id: 1, text: "Thành viên Trần Thị B vừa đề xuất giao dịch chờ duyệt: 'Thu quỹ đóng góp từ nhà tài trợ' (15M)", time: "10 phút trước", isNew: true },
    { id: 2, text: "Hệ thống vừa được điều chỉnh số dư quỹ ban đầu bởi Admin", time: "1 giờ trước", isNew: true },
    { id: 3, text: "Thành viên Trần Thị B vừa hoàn tất đổi mật khẩu lần đầu tiên", time: "2 giờ trước", isNew: false },
    { id: 4, text: "Thành viên Phạm Văn C đã bị tạm khóa tài khoản bởi Admin", time: "1 ngày trước", isNew: false },
  ];

  const memberNotis = [
    { id: 1, text: "Yêu cầu thu hội phí của bạn đã được duyệt thành công bởi Admin (120M)", time: "30 phút trước", isNew: true },
    { id: 2, text: "Yêu cầu chi tiệc liên hoan của bạn đang chờ phê duyệt", time: "1 giờ trước", isNew: true },
    { id: 3, text: "Yêu cầu chi phí in ấn tài liệu của bạn đã bị từ chối bởi Admin", time: "2 ngày trước", isNew: false },
  ];

  useEffect(() => {
    if (user) {
      const readIdsStr = localStorage.getItem("fincore_read_notification_ids");
      const readIds: number[] = readIdsStr ? JSON.parse(readIdsStr) : [];
      
      const defaultNotis = user.role === "Admin" ? adminNotis : memberNotis;
      const restoredNotis = defaultNotis.map(n => ({
        ...n,
        isNew: readIds.includes(n.id) ? false : n.isNew
      }));
      setNotifications(restoredNotis);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => n.isNew).length;

  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    if (!authenticated) {
      router.push("/login");
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser?.isPasswordTemp) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    setIsLoaded(true);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isNew: false }));
      const readIds = updated.map(n => n.id);
      localStorage.setItem("fincore_read_notification_ids", JSON.stringify(readIds));
      return updated;
    });
  };

  const handleMarkSingleRead = (id: number) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isNew: false } : n));
      
      const readIdsStr = localStorage.getItem("fincore_read_notification_ids");
      const readIds: number[] = readIdsStr ? JSON.parse(readIdsStr) : [];
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem("fincore_read_notification_ids", JSON.stringify(readIds));
      }
      return updated;
    });
  };
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwdError(null);
    setChangePwdSuccess(null);

    if (changePwdData.newPassword.length < 6) {
      setChangePwdError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (changePwdData.newPassword !== changePwdData.confirmPassword) {
      setChangePwdError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsChangingPwd(true);
    try {
      await authService.changePassword({
        oldPassword: changePwdData.oldPassword,
        newPassword: changePwdData.newPassword,
      });
      setChangePwdSuccess("Đổi mật khẩu thành công!");
      setChangePwdData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setChangePwdSuccess(null);
      }, 2000);
    } catch (err: any) {
      setChangePwdError(err.response?.data?.message || err.message || "Đổi mật khẩu thất bại.");
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleSystemReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (resetConfirmText !== "RESET") {
      setResetError("Vui lòng nhập chính xác chữ 'RESET' để xác nhận.");
      return;
    }

    setIsResetting(true);
    try {
      await systemService.resetData();
      setResetSuccess("Reset toàn bộ dữ liệu dự án thành công!");
      setResetConfirmText("");
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setResetSuccess(null);
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setResetError(err.response?.data?.message || err.message || "Reset dữ liệu thất bại.");
    } finally {
      setIsResetting(false);
    }
  };
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50/50">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  const currentNotis = notifications;
  
  // Format current page path nicely for breadcrumbs
  const getPageTitle = () => {
    const item = sidebarItems.find(i => i.href === pathname);
    return item ? item.name : "Trang chủ";
  };

  return (
    <div>
      <div className="min-h-screen flex bg-zinc-50/60 text-zinc-800 font-sans selection:bg-emerald-600/20 selection:text-emerald-700">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-zinc-950/20 backdrop-blur-md lg:hidden"
        ></div>
      )}

      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden absolute top-5 left-5 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 bg-white/90 backdrop-blur border border-zinc-200/80 rounded-2xl text-zinc-600 hover:text-zinc-900 shadow-lg shadow-zinc-200/40 transition-all active:scale-95"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md border-r border-zinc-200/50 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="h-20 flex items-center px-7 border-b border-zinc-100/80">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                F
              </div>
              <span className="text-xl font-extrabold tracking-tight text-zinc-950">
                Fin<span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">Core</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-2">
            {sidebarItems.map((item) => {
              if (item.adminOnly && user.role !== "Admin") {
                return null;
              }

              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                      : "text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-900"
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-105 duration-200 ${isActive ? "text-white" : "text-zinc-400 group-hover:text-emerald-600"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 px-6 lg:px-10 flex items-center justify-between gap-4 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.015)] sticky top-0 z-50">
          {/* Breadcrumbs for Navigation */}
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium pl-12 lg:pl-0">
            <span>FinCore</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-900 font-bold">{getPageTitle()}</span>
          </div>

          {/* Notification Icon & Avatar Dropdown */}
          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotiOpen(!isNotiOpen)}
                className="relative p-2.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl hover:bg-zinc-100 hover:border-zinc-300 transition-all text-zinc-600 hover:text-zinc-900 cursor-pointer active:scale-95 shadow-sm"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                    <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotiOpen && (
                <>
                  <div onClick={() => setIsNotiOpen(false)} className="fixed inset-0 z-40"></div>
                  
                  <div className="absolute right-0 mt-3.5 w-85 bg-white border border-zinc-200 rounded-3xl shadow-2xl z-50 p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-250">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <span className="text-sm font-extrabold text-zinc-950">Thông báo mới</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {currentNotis.length === 0 ? (
                        <div className="text-xs text-zinc-400 font-semibold py-8 text-center">
                          Không có thông báo nào
                        </div>
                      ) : (
                        currentNotis.map((noti) => (
                          <div
                            key={noti.id}
                            onClick={() => noti.isNew && handleMarkSingleRead(noti.id)}
                            className={`group/item text-xs space-y-1 py-2 px-2 border-b border-zinc-50/50 transition-all ${
                              noti.isNew 
                                ? "cursor-pointer hover:bg-zinc-50/80 bg-emerald-50/10" 
                                : "hover:bg-zinc-50/20"
                            }`}
                            title={noti.isNew ? "Click để đánh dấu đã đọc" : undefined}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex gap-2.5 items-start">
                                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${noti.isNew ? "bg-emerald-500 animate-pulse" : "bg-zinc-200"}`} />
                                <p className={`leading-relaxed transition-colors ${
                                  noti.isNew 
                                    ? "font-bold text-zinc-950 group-hover/item:text-emerald-600" 
                                    : "font-medium text-zinc-450"
                                }`}>
                                  {noti.text}
                                </p>
                              </div>
                              {noti.isNew && (
                                <span className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 bg-emerald-50 rounded-lg text-emerald-600 shrink-0 mt-0.5">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-semibold block pl-4.5">{noti.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60 rounded-2xl transition-all cursor-pointer active:scale-[0.98] shadow-sm hover:shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-50 to-emerald-100 border border-emerald-200/50 flex items-center justify-center text-emerald-600 shadow-inner">
                  <UserIcon className="w-4.5 h-4.5" />
                </div>
                <div className="hidden sm:block text-left">
                  <h4 className="text-xs font-bold text-zinc-950 leading-none">{user.fullName}</h4>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider bg-zinc-150 text-zinc-550 border border-zinc-200/60 mt-1 leading-none">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Profile Dropdown Panel */}
              {isProfileOpen && (
                <>
                  <div onClick={() => setIsProfileOpen(false)} className="fixed inset-0 z-40"></div>
                  
                  <div className="absolute right-0 mt-3.5 w-56 bg-white border border-zinc-200 rounded-3xl shadow-2xl z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-3 duration-250">
                    <div className="px-3.5 py-2.5 border-b border-zinc-100">
                      <p className="text-xs font-bold text-zinc-900 leading-none">{user.fullName}</p>
                      <p className="text-[10px] text-zinc-400 font-medium truncate mt-1.5 leading-none">{user.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/50 mt-2.5">
                        {user.role}
                      </span>
                    </div>
                     <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setProfileActiveTab("info");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-emerald-600 transition-all duration-150 cursor-pointer text-left active:scale-98 mb-1"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500" />
                      <span>Thông tin cá nhân</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setProfileActiveTab("password");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-emerald-600 transition-all duration-150 cursor-pointer text-left active:scale-98 mb-1"
                    >
                      <Lock className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500" />
                      <span>Đổi mật khẩu</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 cursor-pointer text-left active:scale-98"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-600" />
                Hồ sơ cá nhân
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-100 mb-6">
              <button
                onClick={() => setProfileActiveTab("info")}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                  profileActiveTab === "info"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setProfileActiveTab("password")}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                  profileActiveTab === "password"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Đổi mật khẩu
              </button>
              {user.role === "Admin" && (
                <button
                  onClick={() => setProfileActiveTab("system")}
                  className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                    profileActiveTab === "system"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Hệ thống
                </button>
              )}
            </div>

            {/* Tab Contents */}
            {profileActiveTab === "info" ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center pb-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-2xl mb-3 shadow-inner">
                    {user.fullName.split(" ").pop()?.[0]?.toUpperCase() || "U"}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">{user.fullName}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/50 mt-1">
                    {user.role}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Họ và tên</label>
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm text-zinc-950 font-semibold">
                      {user.fullName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Địa chỉ Email</label>
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm text-zinc-950 font-semibold truncate">
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Vai trò hệ thống</label>
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm text-zinc-950 font-semibold">
                      {user.role === "Admin" ? "Quản trị viên (Admin)" : "Thành viên (Member)"}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setIsProfileModalOpen(false)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md active:scale-98"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : profileActiveTab === "password" ? (
              <div>
                {changePwdError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100">
                    {changePwdError}
                  </div>
                )}
                
                {changePwdSuccess && (
                  <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-sm rounded-2xl border border-emerald-100 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {changePwdSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPwd.old ? "text" : "password"}
                        disabled={isChangingPwd}
                        value={changePwdData.oldPassword}
                        onChange={(e) => setChangePwdData({ ...changePwdData, oldPassword: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, old: !showPwd.old })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600">
                        {showPwd.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Mật khẩu mới</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPwd.new ? "text" : "password"}
                        disabled={isChangingPwd}
                        value={changePwdData.newPassword}
                        onChange={(e) => setChangePwdData({ ...changePwdData, newPassword: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                        placeholder="Tối thiểu 6 ký tự"
                        required
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600">
                        {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPwd.confirm ? "text" : "password"}
                        disabled={isChangingPwd}
                        value={changePwdData.confirmPassword}
                        onChange={(e) => setChangePwdData({ ...changePwdData, confirmPassword: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                        placeholder="Xác nhận lại mật khẩu"
                        required
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600">
                        {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      disabled={isChangingPwd}
                      className="flex-1 bg-white border border-zinc-200 text-zinc-700 font-bold py-3 px-4 rounded-xl text-sm transition-all hover:bg-zinc-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPwd}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isChangingPwd ? "Đang xử lý..." : "Cập nhật"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wide mb-1">Cảnh báo quan trọng</h4>
                    <p className="text-xs leading-relaxed font-medium">
                      Hành động này sẽ xóa toàn bộ các giao dịch và nhật ký hoạt động của dự án. Số dư quỹ câu lạc bộ sẽ được đưa về 0đ. Hệ thống chỉ giữ lại các tài khoản Admin và Member mặc định (seed data) và xóa các tài khoản khác.
                    </p>
                  </div>
                </div>

                {resetError && (
                  <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100">
                    {resetError}
                  </div>
                )}
                
                {resetSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-2xl border border-emerald-100 flex items-center gap-2">
                    <Check className="w-4 h-4 animate-bounce" />
                    {resetSuccess}
                  </div>
                )}

                <form onSubmit={handleSystemReset} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">
                      Xác nhận hành động
                    </label>
                    <p className="text-xs text-zinc-500 mb-2.5">
                      Vui lòng nhập chữ <strong className="text-red-600 select-all">RESET</strong> vào ô dưới đây để tiếp tục.
                    </p>
                    <input
                      type="text"
                      disabled={isResetting}
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-center font-bold tracking-widest text-red-600"
                      placeholder="RESET"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      disabled={isResetting}
                      className="flex-1 bg-white border border-zinc-200 text-zinc-700 font-bold py-3 px-4 rounded-xl text-sm transition-all hover:bg-zinc-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting || resetConfirmText !== "RESET"}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isResetting ? "Đang xóa..." : "Xóa tất cả dữ liệu"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
