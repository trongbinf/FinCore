export interface Transaction {
  id: string;
  title: string;
  type: "Revenue" | "Expense";
  categoryId: string;
  categoryName: string;
  amount: number;
  transactionDate: string;
  description?: string;
  creatorName: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface CreateTransactionData {
  title: string;
  type: number; // 1 = Revenue, 2 = Expense
  categoryId: string;
  amount: number;
  transactionDate: string;
  description?: string;
}

export interface ApproveTransactionData {
  transactionId: string;
  status: number; // 2 = Approved, 3 = Rejected
  rejectionReason?: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: "Revenue" | "Expense";
}

export interface CreateCategoryData {
  name: string;
  type: number; // 1 = Revenue, 2 = Expense
}
