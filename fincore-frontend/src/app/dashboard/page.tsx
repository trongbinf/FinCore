"use client";

import { useEffect, useState } from "react";
import { authService } from "@/services/auth";
import { transactionService } from "@/services/transaction";
import { UserSession } from "@/types/auth";
import { Transaction } from "@/types/transaction";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Clock,
  Settings,
  X,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 370000000,
    totalExpense: 262000000,
    balance: 108000000,
  });

  // Modal Adjustment States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjBalance, setAdjBalance] = useState("");
  const [adjRevenue, setAdjRevenue] = useState("");
  const [adjExpense, setAdjExpense] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Fund stats
      const fund = await transactionService.getFund();
      if (fund) {
        setStats({
          totalRevenue: fund.totalRevenue,
          totalExpense: fund.totalExpense,
          balance: fund.balance,
        });
        setAdjBalance(fund.balance.toString());
        setAdjRevenue(fund.totalRevenue.toString());
        setAdjExpense(fund.totalExpense.toString());
      }

      // 2. Fetch Transactions for dynamic charts & lists
      const txs = await transactionService.getTransactions();
      if (txs) {
        setTransactions(txs);
      }
    } catch (err) {
      console.log("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    setUser(authService.getCurrentUser());
    fetchData();
  }, []);

  const handleAdjustFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await transactionService.adjustFund({
        balance: parseFloat(adjBalance) || 0,
        totalRevenue: parseFloat(adjRevenue) || 0,
        totalExpense: parseFloat(adjExpense) || 0,
      });
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Điều chỉnh số dư quỹ thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Helper to map category names into shorter ones for Pie Chart
  const shortCategoryName = (name: string) => {
    if (name.includes("Hội phí")) return "Hội phí";
    if (name.includes("Tài trợ")) return "Tài trợ";
    if (name.includes("Quyên góp")) return "Quyên góp";
    return name;
  };

  // 1. Group transactions by month dynamically (using YYYY-MM-DD format)
  const getMonthlyChartData = () => {
    const approvedTxs = transactions.filter((t) => t.status === "Approved");
    if (approvedTxs.length === 0) {
      // Fallback matching seeded dataset values initially
      return [
        { month: "Tháng 1", thu: 120000000, chi: 0 },
        { month: "Tháng 2", thu: 250000000, chi: 0 },
        { month: "Tháng 3", thu: 0, chi: 180000000 },
        { month: "Tháng 4", thu: 0, chi: 82000000 },
        { month: "Tháng 5", thu: 0, chi: 0 },
        { month: "Tháng 6", thu: 0, chi: 0 },
      ];
    }

    const monthlyMap: {
      [key: string]: { month: string; thu: number; chi: number };
    } = {
      "01": { month: "Tháng 1", thu: 0, chi: 0 },
      "02": { month: "Tháng 2", thu: 0, chi: 0 },
      "03": { month: "Tháng 3", thu: 0, chi: 0 },
      "04": { month: "Tháng 4", thu: 0, chi: 0 },
      "05": { month: "Tháng 5", thu: 0, chi: 0 },
      "06": { month: "Tháng 6", thu: 0, chi: 0 },
    };

    approvedTxs.forEach((t) => {
      const monthPart = t.transactionDate.split("-")[1]; // e.g. "06"
      if (monthlyMap[monthPart]) {
        if (t.type === "Revenue") {
          monthlyMap[monthPart].thu += t.amount;
        } else {
          monthlyMap[monthPart].chi += t.amount;
        }
      }
    });

    return Object.values(monthlyMap);
  };

  // 2. Group approved Revenue transactions by category dynamically
  const getCategoryChartData = () => {
    const approvedRevenueTxs = transactions.filter(
      (t) => t.status === "Approved" && t.type === "Revenue",
    );

    if (approvedRevenueTxs.length === 0) {
      // Fallback matching seeded data (Hội phí = 120M, Tài trợ = 250M)
      return {
        data: [
          { name: "Hội phí", value: 120000000, color: "#10B981" },
          { name: "Tài trợ", value: 250000000, color: "#3B82F6" },
        ],
        total: 370000000,
      };
    }

    const categoryMap: { [key: string]: number } = {};
    let totalRevenue = 0;

    approvedRevenueTxs.forEach((t) => {
      const rawName = t.categoryName || "Khác";
      const catName = shortCategoryName(rawName);
      categoryMap[catName] = (categoryMap[catName] || 0) + t.amount;
      totalRevenue += t.amount;
    });

    const colors = [
      "#10B981",
      "#3B82F6",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
    ];
    const data = Object.entries(categoryMap).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));

    return {
      data,
      total: totalRevenue,
    };
  };

  // 3. Show top 5 recent transactions dynamically
  const getRecentTransactions = () => {
    if (transactions.length === 0) {
      // Fallback recent list
      return [
        {
          id: "1",
          title: "Hội phí thành viên Q1",
          categoryName: "Hội phí",
          amount: 120000000,
          date: "2026-01-10",
          type: "Revenue",
          status: "Approved",
        },
        {
          id: "2",
          title: "Tài trợ từ đối tác Alpha",
          categoryName: "Tài trợ",
          amount: 250000000,
          date: "2026-02-15",
          type: "Revenue",
          status: "Approved",
        },
        {
          id: "3",
          title: "Chi phí thuê hội trường sự kiện",
          categoryName: "Thuê địa điểm",
          amount: -180000000,
          date: "2026-03-05",
          type: "Expense",
          status: "Approved",
        },
        {
          id: "4",
          title: "Mua sắm máy chiếu & micro mới",
          categoryName: "Thiết bị",
          amount: -82000000,
          date: "2026-04-20",
          type: "Expense",
          status: "Approved",
        },
        {
          id: "5",
          title: "Chi tiệc liên hoan thành viên Q2",
          categoryName: "Liên hoan",
          amount: -24000000,
          date: "2026-06-01",
          type: "Expense",
          status: "Pending",
        },
      ];
    }

    // Sort descending by date & creation
    return [...transactions]
      .sort(
        (a, b) =>
          b.transactionDate.localeCompare(a.transactionDate) ||
          b.id.localeCompare(a.id),
      )
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        categoryName: shortCategoryName(t.categoryName || "Khác"),
        amount: t.type === "Revenue" ? t.amount : -t.amount,
        date: t.transactionDate.split("T")[0],
        type: t.type,
        status: t.status,
      }));
  };

  const monthlyChartData = getMonthlyChartData();
  const categoryChart = getCategoryChartData();
  const recentTransactionsList = getRecentTransactions();

  const formattedPieTotal =
    categoryChart.total >= 1000000
      ? categoryChart.total % 1000000 === 0
        ? `${(categoryChart.total / 1000000).toFixed(0)}M`
        : `${(categoryChart.total / 1000000).toFixed(1)}M`
      : formatMoney(categoryChart.total);

  return (
    <div className="space-y-9 font-sans max-w-7xl mx-auto">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white shadow-xl shadow-zinc-950/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_60%)]"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold md:text-3xl tracking-tight leading-tight">
              Chào mừng trở lại,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                {user?.fullName || "Thành viên"}
              </span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
              Hệ thống FinCore đã sẵn sàng. Dưới đây là tóm tắt toàn diện tình
              hình tài chính của câu lạc bộ được cập nhật theo thời gian thực.
            </p>
          </div>

          {user?.role === "Admin" && (
            <button
              onClick={() => {
                setAdjBalance(stats.balance.toString());
                setAdjRevenue(stats.totalRevenue.toString());
                setAdjExpense(stats.totalExpense.toString());
                setIsAdjustModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Cấu hình số dư quỹ
            </button>
          )}
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="relative overflow-hidden bg-white border border-zinc-200/50 p-7 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Tổng Doanh Thu
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-zinc-950 tracking-tight">
                {formatMoney(stats.totalRevenue)}
              </h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Dòng tiền thu của CLB
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Expense */}
        <div className="relative overflow-hidden bg-white border border-zinc-200/50 p-7 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Tổng Chi Tiêu
              </span>
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-zinc-950 tracking-tight">
                {formatMoney(stats.totalExpense)}
              </h3>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Các khoản chi hoạt động
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Fund Balance */}
        <div className="relative overflow-hidden bg-white border border-zinc-200/50 p-7 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Số Dư Quỹ Hiện Tại
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-emerald-600 tracking-tight">
                {formatMoney(stats.balance)}
              </h3>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Tổng số dư khả dụng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/50 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-zinc-950">
                So sánh Thu - Chi theo Tháng
              </h3>
              <p className="text-xs text-zinc-450 mt-0.5">
                Biến động luồng tiền CLB trong các tháng qua
              </p>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-xl uppercase tracking-wider">
              Năm 2026
            </span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F4F4F5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#A1A1AA"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#A1A1AA"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(244, 244, 245, 0.4)" }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e4e4e7",
                    borderRadius: "16px",
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  }}
                  itemStyle={{
                    color: "#09090b",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                  labelStyle={{
                    color: "#71717a",
                    fontWeight: 650,
                    fontSize: "11px",
                  }}
                  formatter={(value: any) => [
                    formatMoney(Number(value || 0)),
                    "",
                  ]}
                />
                <Bar
                  dataKey="thu"
                  name="Doanh Thu"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="chi"
                  name="Chi Tiêu"
                  fill="#EF4444"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white border border-zinc-200/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950">
              Cơ cấu danh mục Thu
            </h3>
            <p className="text-xs text-zinc-450 mt-0.5">
              Phân tích nguồn thu chính của quỹ
            </p>
          </div>
          <div className="h-56 w-full relative flex items-center justify-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChart.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {categoryChart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e4e4e7",
                    borderRadius: "16px",
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  }}
                  itemStyle={{
                    color: "#09090b",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [
                    formatMoney(Number(value || 0)),
                    "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Tổng Thu
              </span>
              <span className="text-2xl font-black text-zinc-950 mt-0.5">
                {formattedPieTotal}
              </span>
            </div>
          </div>
          {/* Custom Legends dynamically compiled */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-zinc-100">
            {categoryChart.data.slice(0, 3).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                <p className="text-zinc-500 font-medium truncate">
                  {item.name}
                </p>
                <p className="font-bold text-zinc-900">
                  {item.value >= 1000000
                    ? item.value % 1000000 === 0
                      ? `${(item.value / 1000000).toFixed(0)}M`
                      : `${(item.value / 1000000).toFixed(1)}M`
                    : item.value >= 1000
                    ? item.value % 1000 === 0
                      ? `${(item.value / 1000).toFixed(0)}K`
                      : `${(item.value / 1000).toFixed(1)}K`
                    : formatMoney(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Lịch sử giao dịch gần đây
            </h3>
            <p className="text-xs text-zinc-450 mt-0.5">
              Danh sách các khoản thu và chi mới được cập nhật
            </p>
          </div>

          <span className="text-xs font-bold text-zinc-500 bg-zinc-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-zinc-200/60 shrink-0 self-start sm:self-center">
            <Clock className="w-4 h-4 text-zinc-404" />
            Cập nhật thời gian thực
          </span>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50">
                <th className="p-4 pl-7">Tiêu đề giao dịch</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Ngày giao dịch</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4 pr-7">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-100/60">
              {recentTransactionsList.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-zinc-50/50 transition-colors group"
                >
                  <td className="p-4 pl-7 font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                    {tx.title}
                  </td>
                  <td className="p-4 text-zinc-500 font-medium">
                    {tx.categoryName}
                  </td>
                  <td className="p-4 text-zinc-450 font-medium flex items-center gap-1.5 mt-1.5">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {tx.date}
                  </td>
                  <td
                    className={`p-4 font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatMoney(tx.amount)}
                  </td>
                  <td className="p-4 pr-7">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        tx.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/30"
                          : tx.status === "Rejected"
                            ? "bg-red-50 text-red-700 border border-red-200/30"
                            : "bg-amber-50 text-amber-700 border border-amber-200/30"
                      }`}
                    >
                      {tx.status === "Approved"
                        ? "Đã duyệt"
                        : tx.status === "Rejected"
                          ? "Từ chối"
                          : "Chờ duyệt"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Fund Modal Dialog */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-zinc-200/60 rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600 animate-spin-slow" />
                  Cấu hình số dư quỹ
                </h3>
                <p className="text-xs text-zinc-450 mt-0.5">
                  Thay đổi số dư ban đầu của CLB
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustFundSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Số dư quỹ hiện tại (VND)
                </label>
                <input
                  type="number"
                  required
                  value={adjBalance}
                  onChange={(e) => setAdjBalance(e.target.value)}
                  className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Tổng doanh thu tích lũy (VND)
                </label>
                <input
                  type="number"
                  required
                  value={adjRevenue}
                  onChange={(e) => setAdjRevenue(e.target.value)}
                  className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Tổng chi tiêu tích lũy (VND)
                </label>
                <input
                  type="number"
                  required
                  value={adjExpense}
                  onChange={(e) => setAdjExpense(e.target.value)}
                  className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                />
              </div>

              <div className="flex gap-3.5 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang xử lý..." : "Cập nhật số dư"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold py-3.5 px-6 rounded-2xl text-sm transition-all border border-zinc-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
