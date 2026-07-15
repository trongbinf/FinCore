"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { transactionService } from "@/services/transaction";
import { authService } from "@/services/auth";
import { UserSession } from "@/types/auth";
import { Transaction, TransactionCategory } from "@/types/transaction";
import {
  Receipt,
  Search,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Edit,
  Trash,
} from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const MySwal = Swal.mixin({
  customClass: {
    popup: "rounded-2xl border border-zinc-150 shadow-2xl p-6 bg-white",
    title: "text-lg font-bold text-zinc-950",
    htmlContainer: "text-sm text-zinc-500 mt-2",
    confirmButton:
      "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors border-0 focus:ring-2 focus:ring-emerald-600/35 mx-2 cursor-pointer",
    cancelButton:
      "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors mx-2 cursor-pointer",
  },
  buttonsStyling: false,
});

// Form Validation Schema
const createTxSchema = z.object({
  title: z.string().min(3, "Tiêu đề phải từ 3 ký tự trở lên"),
  type: z.string().min(1, "Vui lòng chọn loại giao dịch"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  amount: z
    .string()
    .min(1, "Vui lòng nhập số tiền")
    .refine((val) => parseFloat(val) > 0, "Số tiền phải lớn hơn 0"),
  transactionDate: z.string().min(1, "Vui lòng chọn ngày giao dịch"),
  description: z.string().optional(),
});

type CreateTxFormValues = z.infer<typeof createTxSchema>;

// Fallback Mock Categories
const mockCategories: TransactionCategory[] = [
  { id: "c1", name: "Hội phí thành viên", type: "Revenue" },
  { id: "c2", name: "Tài trợ câu lạc bộ", type: "Revenue" },
  { id: "c3", name: "Quyên góp quỹ", type: "Revenue" },
  { id: "c4", name: "Thuê địa điểm", type: "Expense" },
  { id: "c5", name: "Ăn uống & Liên hoan", type: "Expense" },
  { id: "c6", name: "Văn phòng phẩm & In ấn", type: "Expense" },
];

const mockTransactions: Transaction[] = [
  {
    id: "1",
    title: "Hội phí thành viên Q2",
    type: "Revenue",
    categoryId: "c1",
    categoryName: "Hội phí thành viên",
    amount: 20000000,
    transactionDate: "2026-06-01",
    creatorName: "Trần Thị B",
    status: "Approved",
    approvedByName: "Nguyễn Văn A",
    approvedAt: "2026-06-02",
  },
  {
    id: "2",
    title: "Chi phí thuê hội trường sự kiện",
    type: "Expense",
    categoryId: "c4",
    categoryName: "Thuê địa điểm",
    amount: 6500000,
    transactionDate: "2026-06-05",
    creatorName: "Trần Thị B",
    status: "Approved",
    approvedByName: "Nguyễn Văn A",
    approvedAt: "2026-06-06",
  },
  {
    id: "3",
    title: "Thu quỹ đóng góp từ nhà tài trợ",
    type: "Revenue",
    categoryId: "c2",
    categoryName: "Tài trợ câu lạc bộ",
    amount: 15000000,
    transactionDate: "2026-06-10",
    creatorName: "Trần Thị B",
    status: "Pending",
  },
  {
    id: "4",
    title: "Mua sắm backdrop và hoa trang trí",
    type: "Expense",
    categoryId: "c6",
    categoryName: "Văn phòng phẩm & In ấn",
    amount: 1200000,
    transactionDate: "2026-06-12",
    creatorName: "Trần Thị B",
    status: "Rejected",
    approvedByName: "Nguyễn Văn A",
    approvedAt: "2026-06-13",
    rejectionReason: "Chi phí không có hóa đơn chứng từ kèm theo.",
  },
];

export default function TransactionsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const isAdmin = user?.role === "Admin";
  const [activeTab, setActiveTab] = useState<"transactions" | "categories">(
    "transactions",
  );
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [categories, setCategories] =
    useState<TransactionCategory[]>(mockCategories);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("All");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    type: "Revenue" | "Expense";
  } | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"Revenue" | "Expense">(
    "Revenue",
  );
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Drawer / Modals UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTxFormValues>({
    resolver: zodResolver(createTxSchema),
    defaultValues: {
      type: "1", // Revenue default
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  // Fetch from API on load if possible
  useEffect(() => {
    const fetchData = async () => {
      try {
        const txList = await transactionService.getTransactions();
        if (txList && txList.length > 0) setTransactions(txList);

        const catList = await transactionService.getCategories();
        if (catList && catList.length > 0) setCategories(catList);
      } catch (err) {
        console.log("Using local mock transactions fallback.");
      }
    };
    fetchData();
  }, []);

  const openCreateDrawer = () => {
    if (!isAdmin) return;

    setEditingTx(null);
    reset({
      title: "",
      type: "1",
      categoryId: "",
      amount: "",
      transactionDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setIsDrawerOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryType("Revenue");
    setCategoryError(null);
  };

  const openCategoryModal = (category?: {
    id: string;
    name: string;
    type: "Revenue" | "Expense";
  }) => {
    if (!isAdmin) return;
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryType(category.type);
    } else {
      resetCategoryForm();
    }
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    resetCategoryForm();
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setCategoryError("Vui lòng nhập tên danh mục.");
      return;
    }

    setCategoryError(null);
    setIsLoading(true);
    try {
      if (editingCategory) {
        await transactionService.updateCategory(editingCategory.id, {
          name: categoryName,
          type: categoryType === "Revenue" ? 1 : 2,
        });
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id
              ? { ...cat, name: categoryName, type: categoryType }
              : cat,
          ),
        );
        showToast("Cập nhật danh mục thành công!");
      } else {
        const newId = await transactionService.createCategory({
          name: categoryName,
          type: categoryType === "Revenue" ? 1 : 2,
        });
        setCategories((prev) => [
          ...prev,
          { id: newId, name: categoryName, type: categoryType },
        ]);
        showToast("Thêm danh mục giao dịch mới thành công!");
      }
      closeCategoryModal();
    } catch (err: any) {
      setCategoryError(
        err.response?.data?.message || err.message || "Thao tác thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    MySwal.fire({
      title: "Xóa danh mục?",
      text: "Bạn có chắc chắn muốn vô hiệu hoá danh mục này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy bỏ",
      iconColor: "#EF4444",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await transactionService.deleteCategory(categoryId);
          setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
          showToast("Đã vô hiệu hoá danh mục thành công!");
        } catch (err) {
          showToast("Xoá danh mục thất bại.", "error");
        }
      }
    });
  };

  const openEditDrawer = (tx: Transaction) => {
    setEditingTx(tx);
    reset({
      title: tx.title,
      type: tx.type === "Revenue" ? "1" : "2",
      categoryId: tx.categoryId,
      amount: tx.amount.toString(),
      transactionDate: tx.transactionDate,
      description: tx.description || "",
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteTransaction = async (txId: string) => {
    MySwal.fire({
      title: "Xóa giao dịch?",
      text: "Bạn có chắc chắn muốn xóa giao dịch này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy bỏ",
      iconColor: "#EF4444",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await transactionService.deleteTransaction(txId);
          setTransactions(transactions.filter((t) => t.id !== txId));
          showToast("Đã xóa giao dịch thành công!");
        } catch (err) {
          showToast("Xóa giao dịch thất bại.", "error");
        }
      }
    });
  };

  // Create or Update Transaction
  const onFormSubmit = async (values: CreateTxFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedCat = categories.find((c) => c.id === values.categoryId);
      const categoryName = selectedCat ? selectedCat.name : "Danh mục khác";

      if (editingTx) {
        // Update flow
        await transactionService.updateTransaction(editingTx.id, {
          title: values.title,
          type: parseInt(values.type),
          categoryId: values.categoryId,
          amount: parseFloat(values.amount),
          transactionDate: values.transactionDate,
          description: values.description,
        });

        setTransactions(
          transactions.map((t) => {
            if (t.id === editingTx.id) {
              return {
                ...t,
                title: values.title,
                type: parseInt(values.type) === 1 ? "Revenue" : "Expense",
                categoryId: values.categoryId,
                category: { name: categoryName },
                amount: parseFloat(values.amount),
                transactionDate: values.transactionDate,
                description: values.description,
              };
            }
            return t;
          }),
        );
        showToast("Cập nhật giao dịch thành công!");
      } else {
        // Create flow
        const txId = await transactionService.createTransaction({
          title: values.title,
          type: parseInt(values.type),
          categoryId: values.categoryId,
          amount: parseFloat(values.amount),
          transactionDate: values.transactionDate,
          description: values.description,
        });

        const newTx: Transaction = {
          id: txId || Math.random().toString(),
          title: values.title,
          type: parseInt(values.type) === 1 ? "Revenue" : "Expense",
          categoryId: values.categoryId,
          categoryName: categoryName,
          amount: parseFloat(values.amount),
          transactionDate: values.transactionDate,
          description: values.description,
          creatorName: user?.fullName || "Bản thân",
          status: "Pending",
        };

        setTransactions([newTx, ...transactions]);
        showToast("Thêm giao dịch mới chờ duyệt thành công!");
      }

      setIsDrawerOpen(false);
      reset();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Thao tác thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Approve Transaction
  const handleApprove = async (txId: string) => {
    try {
      await transactionService.approveTransaction({
        transactionId: txId,
        status: 2, // Approved
      });

      setTransactions(
        transactions.map((t) => {
          if (t.id === txId) {
            return {
              ...t,
              status: "Approved",
              approvedBy: { fullName: user?.fullName || "Người duyệt" },
              approvedAt: new Date().toISOString().split("T")[0],
            };
          }
          return t;
        }),
      );
      showToast("Phê duyệt giao dịch thành công!");
    } catch (err) {
      showToast("Phê duyệt thất bại.", "error");
    }
  };

  // Open Rejection Dialog
  const openRejectDialog = (tx: Transaction) => {
    setRejectingTx(tx);
    setRejectionReason("");
  };

  // Submit Rejection
  const handleRejectSubmit = async () => {
    if (!rejectingTx || !rejectionReason.trim()) return;
    try {
      await transactionService.approveTransaction({
        transactionId: rejectingTx.id,
        status: 3, // Rejected
        rejectionReason: rejectionReason,
      });

      setTransactions(
        transactions.map((t) => {
          if (t.id === rejectingTx.id) {
            return {
              ...t,
              status: "Rejected",
              rejectionReason: rejectionReason,
              approvedBy: { fullName: user?.fullName || "Người từ chối" },
              approvedAt: new Date().toISOString().split("T")[0],
            };
          }
          return t;
        }),
      );
      setRejectingTx(null);
      showToast("Đã từ chối giao dịch thành công!");
    } catch (err) {
      showToast("Từ chối thất bại.", "error");
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const showRejectionReason = (title: string, reason: string) => {
    MySwal.fire({
      title: "Lý do từ chối",
      html: `
        <div class="text-left font-sans mt-3 text-zinc-650" style="text-align: left; font-family: sans-serif; margin-top: 12px; color: #4b5563;">
          <p class="mb-2" style="margin-bottom: 8px;">
            Giao dịch: <strong class="text-zinc-900" style="color: #111827;">${title}</strong>
          </p>
          <div class="bg-red-50 border border-red-200/60 p-4 rounded-2xl text-red-800 font-semibold leading-relaxed" style="background-color: #FEF2F2; border: 1px solid rgba(239, 68, 68, 0.2); padding: 16px; border-radius: 16px; color: #991B1B; font-weight: 600; line-height: 1.625;">
            ${reason}
          </div>
        </div>
      `,
      confirmButtonText: "Đóng lại",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer border-0 active:scale-95",
        popup: "rounded-3xl border border-zinc-200/50 shadow-2xl p-6 bg-white",
        title: "text-lg font-bold text-zinc-950",
      },
    });
  };

  // Filter Transactions list
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || t.type === typeFilter;
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesCategory =
      categoryFilter === "All" || t.categoryId === categoryFilter;

    const tDate = t.transactionDate.split("T")[0];
    const matchesFromDate = !fromDate || tDate >= fromDate;
    const matchesToDate = !toDate || tDate <= toDate;

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesCategory &&
      matchesFromDate &&
      matchesToDate
    );
  });

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase());
    const matchesType = categoryTypeFilter === "All" || cat.type === categoryTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-9 font-sans max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-emerald-600" />
            Quản lý thu chi
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ghi nhận giao dịch tài chính phát sinh và xem tiến trình phê duyệt
            các khoản quỹ.
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <div className="flex items-center gap-2 rounded-3xl border border-zinc-200/50 bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "transactions"
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Quản lý giao dịch
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "categories"
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Quản lý danh mục
              </button>
            </div>
            {activeTab === "transactions" && (
              <button
                onClick={openCreateDrawer}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                Ghi nhận giao dịch
              </button>
            )}
          </div>
        )}
      </div>

      {(!isAdmin || activeTab === "transactions") && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white border border-zinc-200/50 p-6 rounded-3xl shadow-sm space-y-4">
            {/* Row 1: Search, Category, Type, Status */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm giao dịch theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50/50 border border-zinc-200/80 text-zinc-900 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="All">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="All">Tất cả loại giao dịch</option>
                  <option value="Revenue">Khoản Thu (Revenue)</option>
                  <option value="Expense">Khoản Chi (Expense)</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Approved">Đã duyệt</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </div>
            </div>

            {/* Row 2: Date Filters & Clear Button */}
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
                    className="bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
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
                    className="bg-zinc-50/50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>
              {(searchTerm ||
                typeFilter !== "All" ||
                statusFilter !== "All" ||
                categoryFilter !== "All" ||
                fromDate ||
                toDate) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("All");
                    setStatusFilter("All");
                    setCategoryFilter("All");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 border border-red-100 hover:border-red-200 px-4.5 py-2.5 rounded-2xl cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50">
                    <th className="p-4 pl-7">Tiêu đề giao dịch</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Ngày thực hiện</th>
                    <th className="p-4">Người tạo</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4">Trạng thái</th>
                    {user?.role === "Admin" && (
                      <th className="p-4 pr-7 text-right">Duyệt & Quản lý</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-100/60">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/50 transition-colors group"
                    >
                      <td className="p-4 pl-7 font-semibold text-zinc-900">
                        <p className="group-hover:text-emerald-600 transition-colors">
                          {tx.title}
                        </p>
                      </td>
                      <td className="p-4 text-zinc-500 font-medium">
                        {tx.categoryName}
                      </td>
                      <td className="p-4 text-zinc-455 font-medium flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4 text-zinc-405" />
                        {tx.transactionDate.split("T")[0]}
                      </td>
                      <td className="p-4 text-zinc-500 font-semibold">
                        {tx.creatorName}
                      </td>
                      <td
                        className={`p-4 font-bold ${tx.type === "Revenue" ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {tx.type === "Revenue" ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="p-4">
                        {tx.status === "Rejected" ? (
                          <button
                            onClick={() =>
                              showRejectionReason(
                                tx.title,
                                tx.rejectionReason ||
                                  "Không có lý do chi tiết.",
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 cursor-pointer active:scale-95 transition-all"
                            title="Xem lý do từ chối"
                          >
                            <span>Từ chối</span>
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              tx.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-250/20"
                                : "bg-amber-50 text-amber-700 border border-amber-250/20"
                            }`}
                          >
                            {tx.status === "Approved"
                              ? "Đã duyệt"
                              : "Chờ duyệt"}
                          </span>
                        )}
                      </td>
                      {user?.role === "Admin" && (
                        <td className="p-4 pr-7 text-right">
                          {tx.status === "Pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApprove(tx.id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 p-2 rounded-xl transition-all active:scale-90 cursor-pointer"
                                title="Phê duyệt"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openRejectDialog(tx)}
                                className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200/60 p-2 rounded-xl transition-all active:scale-90 cursor-pointer"
                                title="Từ chối"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditDrawer(tx)}
                                className="bg-zinc-50 hover:bg-zinc-155 text-zinc-700 border border-zinc-200/60 p-2 rounded-xl transition-all active:scale-90 cursor-pointer"
                                title="Sửa giao dịch"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="bg-red-50 hover:bg-red-150 text-red-650 border border-red-200/60 p-2 rounded-xl transition-all active:scale-90 cursor-pointer"
                                title="Xóa giao dịch"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 font-semibold italic">
                              Duyệt bởi: {tx.approvedByName}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={user?.role === "Admin" ? 7 : 6}
                        className="p-8 text-center text-zinc-500 font-semibold"
                      >
                        Không tìm thấy giao dịch nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Categories Tab (Admin only) */}
      {isAdmin && activeTab === "categories" && (
        <div className="bg-white border border-zinc-200/50 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                Quản lý danh mục giao dịch
              </h2>
              <p className="text-sm text-zinc-500">
                Tạo, sửa và vô hiệu hoá danh mục thu/chi.
              </p>
            </div>
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-2xl text-sm transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm danh mục
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 transition-all"
              />
            </div>
            <select
              value={categoryTypeFilter}
              onChange={(e) => setCategoryTypeFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/10 transition-all sm:w-48 appearance-none cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
            >
              <option value="All">Tất cả các loại</option>
              <option value="Revenue">Thu (Revenue)</option>
              <option value="Expense">Chi (Expense)</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="p-3">Tên danh mục</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-100/60">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="p-3 font-semibold text-zinc-900">
                        {cat.name}
                      </td>
                      <td className="p-3 text-zinc-600">{cat.type}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openCategoryModal(cat)}
                            className="bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200/60 p-2 rounded-xl transition-all"
                            title="Sửa danh mục"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 p-2 rounded-xl transition-all"
                            title="Vô hiệu hoá danh mục"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-6 text-center text-zinc-500 font-semibold"
                    >
                      Không có danh mục nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                      <Receipt className="w-5 h-5 text-emerald-600" />
                      {editingTx ? "Chỉnh sửa giao dịch" : "Ghi nhận giao dịch"}
                    </h3>
                    <p className="text-xs text-zinc-450 mt-0.5">
                      {editingTx
                        ? "Thay đổi nội dung giao dịch chờ duyệt"
                        : "Tạo đề xuất thu chi mới"}
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
                <form
                  onSubmit={handleSubmit(onFormSubmit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Tiêu đề giao dịch
                    </label>
                    <input
                      type="text"
                      disabled={isLoading}
                      placeholder="Ví dụ: Thu hội phí thành viên Q2"
                      {...register("title")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold"
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-xs text-red-655 font-semibold">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Loại giao dịch
                    </label>
                    <select
                      disabled={isLoading || !!editingTx}
                      {...register("type")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold disabled:opacity-60"
                    >
                      <option value="1">Khoản Thu (Revenue)</option>
                      <option value="2">Khoản Chi (Expense)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Danh mục giao dịch
                    </label>
                    <select
                      disabled={isLoading}
                      {...register("categoryId")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-855 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories
                        .filter((c) =>
                          selectedType === "1"
                            ? c.type === "Revenue"
                            : c.type === "Expense",
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1.5 text-xs text-red-655 font-semibold">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Số tiền (VND)
                    </label>
                    <input
                      type="number"
                      disabled={isLoading}
                      placeholder="Nhập số tiền phát sinh"
                      {...register("amount")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold"
                    />
                    {errors.amount && (
                      <p className="mt-1.5 text-xs text-red-655 font-semibold">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Ngày giao dịch
                    </label>
                    <input
                      type="date"
                      disabled={isLoading}
                      {...register("transactionDate")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                    {errors.transactionDate && (
                      <p className="mt-1.5 text-xs text-red-655 font-semibold">
                        {errors.transactionDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Mô tả chi tiết (Tùy chọn)
                    </label>
                    <textarea
                      disabled={isLoading}
                      rows={3}
                      placeholder="Mô tả mục đích chi tiêu hoặc các lưu ý kèm theo..."
                      {...register("description")}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-medium"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading
                      ? "Đang xử lý..."
                      : editingTx
                        ? "Lưu thay đổi"
                        : "Ghi nhận & Yêu cầu duyệt"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={closeCategoryModal}
            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-zinc-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-950">
                      {editingCategory
                        ? "Chỉnh sửa danh mục"
                        : "Thêm danh mục mới"}
                    </h3>
                    <p className="text-xs text-zinc-450 mt-0.5">
                      {editingCategory
                        ? "Cập nhật tên và loại danh mục giao dịch"
                        : "Tạo danh mục thu/chi để sử dụng cho giao dịch"}
                    </p>
                  </div>
                  <button
                    onClick={closeCategoryModal}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Tên danh mục
                    </label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ví dụ: Hội phí thành viên"
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Loại danh mục
                    </label>
                    <select
                      value={categoryType}
                      onChange={(e) =>
                        setCategoryType(e.target.value as "Revenue" | "Expense")
                      }
                      disabled={isLoading}
                      className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold"
                    >
                      <option value="Revenue">Khoản Thu (Revenue)</option>
                      <option value="Expense">Khoản Chi (Expense)</option>
                    </select>
                  </div>

                  {categoryError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {categoryError}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveCategory}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                >
                  {isLoading
                    ? "Đang xử lý..."
                    : editingCategory
                      ? "Lưu danh mục"
                      : "Thêm danh mục"}
                </button>
                <button
                  onClick={closeCategoryModal}
                  disabled={isLoading}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold py-3.5 rounded-2xl text-sm transition-all border border-zinc-200 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal dialog */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-zinc-200/60 rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
            <h3 className="text-base font-extrabold text-zinc-950 mb-1">
              Từ chối duyệt giao dịch
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Giao dịch:{" "}
              <strong className="text-zinc-900">{rejectingTx.title}</strong> (
              {formatMoney(rejectingTx.amount)})
            </p>

            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối giao dịch này..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-medium mb-5"
            ></textarea>

            <div className="flex gap-3">
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => setRejectingTx(null)}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold py-3.5 px-6 rounded-2xl text-sm transition-colors border border-zinc-200 cursor-pointer"
              >
                Hủy bỏ
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
          <CheckCircle
            className={`w-5 h-5 shrink-0 ${toast.type === "success" ? "text-emerald-600" : "text-red-500"}`}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
