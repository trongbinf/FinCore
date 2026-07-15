"use client";

import { useEffect, useState } from "react";
import { logService } from "@/services/log";
import { userService } from "@/services/user";
import { authService } from "@/services/auth";
import { ActivityLog } from "@/types/log";
import { History, Search, RefreshCw, Clock } from "lucide-react";

const mockLogs: ActivityLog[] = [
  {
    id: "1",
    userFullName: "Admin FinCore",
    action: "Khởi tạo hệ thống",
    entityName: "System",
    description: "Khởi tạo hệ thống tài chính và thiết lập số dư quỹ ban đầu.",
    timestamp: "2026-07-11T13:30:00Z",
  },
  {
    id: "2",
    userFullName: "Admin FinCore",
    action: "Cấp tài khoản mới",
    entityName: "User",
    entityId: "u2",
    description:
      "Cấp tài khoản mới cho Trần Thị B (Email: member@fincore.com, Vai trò: Member).",
    timestamp: "2026-07-11T13:32:00Z",
  },
  {
    id: "3",
    userFullName: "Trần Thị B",
    action: "Đăng nhập hệ thống",
    entityName: "User",
    description: "Người dùng đăng nhập vào trang quản trị lần đầu.",
    timestamp: "2026-07-11T13:35:00Z",
  },
  {
    id: "4",
    userFullName: "Trần Thị B",
    action: "Đổi mật khẩu",
    entityName: "User",
    description: "Thành viên tự đổi mật khẩu tạm sang mật khẩu chính thức.",
    timestamp: "2026-07-11T13:36:00Z",
  },
  {
    id: "5",
    userFullName: "Trần Thị B",
    action: "Tạo đề xuất giao dịch",
    entityName: "Transaction",
    entityId: "t1",
    description:
      "Đề xuất khoản chi 'Chi tiệc liên hoan thành viên Q2', Số tiền: 24.000.000đ.",
    timestamp: "2026-07-11T13:40:00Z",
  },
  {
    id: "6",
    userFullName: "Admin FinCore",
    action: "Duyệt giao dịch",
    entityName: "Transaction",
    entityId: "t1",
    description:
      "Phê duyệt khoản chi 'Chi tiệc liên hoan thành viên Q2', Số tiền: 24.000.000đ.",
    timestamp: "2026-07-11T13:42:00Z",
  },
];

const mockAccounts = [
  { id: "1", fullName: "Admin FinCore", role: "Admin" },
  { id: "2", fullName: "Trần Thị B", role: "Member" },
];

export default function LogsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [logs, setLogs] = useState<ActivityLog[]>(mockLogs);
  const [accounts, setAccounts] = useState<any[]>(mockAccounts);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsLoaded(true);
  }, []);

  const fetchLogs = async () => {
    if (!currentUser || currentUser.role !== "Admin") {
      return;
    }

    setIsLoading(true);
    try {
      const logList = await logService.getActivityLogs();
      if (logList && logList.length > 0) {
        setLogs(logList);
      }

      const userList = await userService.getUsers();
      if (userList && userList.length > 0) {
        const mappedUsers = userList.map((u: any) => ({
          id: u.id,
          fullName: u.fullName,
          role: u.role === "Admin" || u.role === 1 ? "Admin" : "Member",
        }));
        setAccounts(mappedUsers);
      }
    } catch (err) {
      console.log("Using mock logs fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchLogs();
    }
  }, [currentUser]);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description &&
        log.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Find the user's role
    const userAccount = accounts.find((a) => a.fullName === log.userFullName);
    const userRole = userAccount
      ? userAccount.role
      : log.userFullName === "Admin FinCore"
        ? "Admin"
        : "Member";
    const matchesRole = roleFilter === "All" || userRole === roleFilter;

    const matchesUser = userFilter === "All" || log.userFullName === userFilter;

    const logDate = log.timestamp.split("T")[0];
    const matchesFromDate = !fromDate || logDate >= fromDate;
    const matchesToDate = !toDate || logDate <= toDate;

    return (
      matchesSearch &&
      matchesRole &&
      matchesUser &&
      matchesFromDate &&
      matchesToDate
    );
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
          <p className="text-xs text-red-500 mt-1">
            Bạn không có quyền hạn quản trị để truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 lg:text-3xl flex items-center gap-3">
            <History className="w-8 h-8 text-emerald-600" />
            Nhật ký hoạt động
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Theo dõi toàn bộ lịch sử thao tác của Ban quản lý và hoạt động đăng
            nhập hệ thống để bảo đảm minh bạch.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Tải lại nhật ký
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm space-y-4">
        {/* Row 1: Search, User Filter, Entity Filter */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm hành động, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setUserFilter("All");
              }}
              className="bg-zinc-50/50 border border-zinc-200 text-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600 font-semibold w-full sm:w-44"
            >
              <option value="All">Tất cả vai trò</option>
              <option value="Admin">Quản trị viên (Admin)</option>
              <option value="Member">Thành viên (Member)</option>
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-zinc-50/50 border border-zinc-200 text-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600 font-semibold w-full sm:w-52"
            >
              <option value="All">Tất cả tài khoản</option>
              {accounts
                .filter(
                  (acc) => roleFilter === "All" || acc.role === roleFilter,
                )
                .map((acc) => (
                  <option key={acc.id} value={acc.fullName}>
                    {acc.fullName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Range & Clear Filters Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Từ:
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-zinc-50/50 border border-zinc-200 text-zinc-800 rounded-xl px-4 py-1.5 text-sm focus:outline-none focus:border-emerald-600 font-semibold cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Đến:
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-zinc-50/50 border border-zinc-200 text-zinc-800 rounded-xl px-4 py-1.5 text-sm focus:outline-none focus:border-emerald-600 font-semibold cursor-pointer"
              />
            </div>
          </div>
          {(searchTerm ||
            userFilter !== "All" ||
            roleFilter !== "All" ||
            fromDate ||
            toDate) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setUserFilter("All");
                setRoleFilter("All");
                setFromDate("");
                setToDate("");
              }}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 border border-red-100 hover:border-red-200 px-4 py-2 rounded-xl cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-400 font-semibold uppercase bg-zinc-50/50">
                <th className="p-4 pl-6">Người thực hiện</th>
                <th className="p-4">Hành động</th>
                <th className="p-4">Đối tượng</th>
                <th className="p-4">Mô tả chi tiết</th>
                <th className="p-4 pr-6">Thời gian</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-zinc-50/70 transition-colors"
                >
                  <td className="p-4 pl-6 font-semibold text-zinc-900">
                    {log.userFullName}
                  </td>
                  <td className="p-4 text-zinc-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500 font-mono text-xs">
                    {log.entityName}
                  </td>
                  <td className="p-4 text-zinc-650 font-medium max-w-md break-words">
                    {log.description || "—"}
                  </td>
                  <td className="p-4 pr-6 text-zinc-500 flex items-center gap-1.5 mt-1 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {formatTime(log.timestamp)}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Không tìm thấy nhật ký hoạt động nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
