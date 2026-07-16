"use client";

import { useEffect, useState } from "react";
import { transactionService } from "@/services/transaction";
import { Transaction } from "@/types/transaction";
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const mockTransactions: Transaction[] = [
  { id: "1", title: "Hội phí thành viên Q2", type: "Revenue", categoryId: "c1", categoryName: "Hội phí thành viên", amount: 20000000, transactionDate: "2026-06-01", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-02" },
  { id: "2", title: "Chi phí thuê hội trường sự kiện", type: "Expense", categoryId: "c4", categoryName: "Thuê địa điểm", amount: 6500000, transactionDate: "2026-06-05", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-06" },
  { id: "3", title: "Thu quỹ đóng góp từ nhà tài trợ", type: "Revenue", categoryId: "c2", categoryName: "Tài trợ câu lạc bộ", amount: 15000000, transactionDate: "2026-06-10", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-11" },
  { id: "4", title: "Mua sắm backdrop và hoa trang trí", type: "Expense", categoryId: "c6", categoryName: "Văn phòng phẩm & In ấn", amount: 1200000, transactionDate: "2026-06-12", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-13" },
  { id: "5", title: "Tài trợ chương trình Mùa Hè Xanh", type: "Revenue", categoryId: "c2", categoryName: "Tài trợ câu lạc bộ", amount: 25000000, transactionDate: "2026-06-20", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-21" },
  { id: "6", title: "Chi mua bánh kẹo họp định kỳ", type: "Expense", categoryId: "c5", categoryName: "Ăn uống & Liên hoan", amount: 800000, transactionDate: "2026-06-25", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-26" },
  { id: "7", title: "Thu hội phí bổ sung Tháng 6", type: "Revenue", categoryId: "c1", categoryName: "Hội phí thành viên", amount: 5000000, transactionDate: "2026-06-28", creatorName: "Trần Thị B", status: "Approved", approvedByName: "Nguyễn Văn A", approvedAt: "2026-06-29" },
];

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Filter States
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-06-30");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const txList = await transactionService.getTransactions();
        // Only show approved transactions in reports
        if (txList) {
          setTransactions(txList.filter((t) => t.status === "Approved"));
        }
        const catList = await transactionService.getCategories();
        if (catList && catList.length > 0) {
          setCategories(catList);
        }
      } catch (err) {
        console.log("Using mock data fallback for reports.");
        // Extract unique categories from mock transactions
        const uniqueCats = Array.from(
          new Set(mockTransactions.map((t) => JSON.stringify({ id: t.categoryId, name: t.categoryName })))
        ).map((s) => JSON.parse(s));
        setCategories(uniqueCats);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const filteredTx = transactions.filter((t) => {
    if (t.status !== "Approved") return false;
    const dateMatch = t.transactionDate >= fromDate && t.transactionDate <= toDate;
    const typeMatch = typeFilter === "All" || t.type === typeFilter;
    const catMatch = categoryFilter === "All" || t.categoryId === categoryFilter;
    return dateMatch && typeMatch && catMatch;
  });

  // Calculate totals
  const totalRevenue = filteredTx
    .filter((t) => t.type === "Revenue")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTx
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalRevenue - totalExpense;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Generate chart data based on filtered dates
  // Group by date
  const chartGroupedData = filteredTx.reduce((acc: any, t) => {
    const dateStr = t.transactionDate.split("T")[0];
    if (!acc[dateStr]) {
      acc[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
    }
    if (t.type === "Revenue") {
      acc[dateStr].revenue += t.amount;
    } else {
      acc[dateStr].expense += t.amount;
    }
    return acc;
  }, {});

  const chartData = Object.values(chartGroupedData).sort((a: any, b: any) =>
    a.date.localeCompare(b.date)
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (filteredTx.length === 0) {
      alert("Không có dữ liệu để xuất Excel.");
      return;
    }

    // Define CSV headers
    const headers = ["Tiêu đề giao dịch", "Loại", "Danh mục", "Ngày giao dịch", "Người duyệt", "Số tiền (VND)"];
    
    // Format rows
    const rows = filteredTx.map((tx) => [
      tx.title.replace(/"/g, '""'), // Escape quotes
      tx.type === "Revenue" ? "Thu" : "Chi",
      tx.categoryName || "Khác",
      tx.transactionDate,
      tx.approvedByName || "—",
      tx.type === "Revenue" ? tx.amount : -tx.amount
    ]);

    // Merge headers and rows into CSV content
    const csvContent = 
      "\uFEFF" + // UTF-8 BOM to display Vietnamese characters correctly in Excel
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    // Create Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Báo_cáo_tài_chính_${fromDate}_đến_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 font-sans print:p-0 print:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 lg:text-3xl flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Báo cáo tài chính
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Xem báo cáo tổng thu chi, số dư quỹ câu lạc bộ theo khoảng thời gian và danh mục.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-bold py-3 px-5 rounded-2xl text-sm transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            Xuất Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            In Báo cáo
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b border-zinc-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">BÁO CÁO TÀI CHÍNH CÂU LẠC BỘ</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Thời gian: Từ ngày {fromDate} đến ngày {toDate}
        </p>
      </div>

      {/* Filters (Hidden during print) */}
      <div className="bg-white border border-zinc-200/50 p-5 rounded-3xl shadow-sm space-y-4 print:hidden">
        <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
          <Filter className="w-4.5 h-4.5 text-emerald-600" />
          Bộ lọc báo cáo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Từ ngày</label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Đến ngày</label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Loại giao dịch</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
            >
              <option value="All">Tất cả loại</option>
              <option value="Revenue">Khoản Thu (Revenue)</option>
              <option value="Expense">Khoản Chi (Expense)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Danh mục</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
            >
              <option value="All">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
        <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng thu trong kỳ</p>
            <h3 className="text-xl font-bold text-zinc-900 mt-1">{formatMoney(totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng chi trong kỳ</p>
            <h3 className="text-xl font-bold text-zinc-900 mt-1">{formatMoney(totalExpense)}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <TrendingDown className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Thặng dư / Số dư</p>
            <h3 className={`text-xl font-bold mt-1 ${balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatMoney(balance)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white border border-zinc-200/50 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-zinc-950">Xu hướng biến động tài chính</h3>
              <p className="text-xs text-zinc-450 mt-0.5">Biểu đồ biểu diễn các khoản thu chi tích lũy theo thời gian</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-xl uppercase tracking-wider print:hidden">
              Trực quan hóa xu hướng
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A", borderRadius: "16px", color: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
                  formatter={(value: any) => [formatMoney(Number(value || 0)), ""]}
                />
                <Area type="monotone" dataKey="revenue" name="Khoản Thu" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expense" name="Khoản Chi" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Transaction List Table */}
      <div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Chi tiết các giao dịch trong kỳ
            </h3>
            <p className="text-xs text-zinc-450 mt-0.5">Các giao dịch đã được phê duyệt hợp lệ trong mốc thời gian lọc</p>
          </div>
          <span className="text-xs font-bold text-zinc-500 bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-200/60 print:hidden shrink-0">
            Có {filteredTx.length} giao dịch được duyệt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50">
                <th className="p-4 pl-7">Tiêu đề giao dịch</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Ngày giao dịch</th>
                <th className="p-4">Người duyệt</th>
                <th className="p-4 pr-7 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-100/60">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="p-4 pl-7 font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors">{tx.title}</td>
                  <td className="p-4 text-zinc-500 font-medium">{tx.categoryName}</td>
                  <td className="p-4 text-zinc-455 font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-405" />
                    {tx.transactionDate.split("T")[0]}
                  </td>
                  <td className="p-4 text-zinc-500 font-semibold">{tx.approvedByName || "—"}</td>
                  <td className={`p-4 pr-7 text-right font-bold ${tx.type === "Revenue" ? "text-emerald-600" : "text-red-500"}`}>
                    {tx.type === "Revenue" ? "+" : "-"}{formatMoney(tx.amount)}
                  </td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-550 font-semibold">
                    Không có giao dịch nào thỏa mãn bộ lọc.
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
