import api from "./api";
import { Transaction, CreateTransactionData, ApproveTransactionData, TransactionCategory, CreateCategoryData } from "@/types/transaction";

export interface ClubFundData {
  totalRevenue: number;
  totalExpense: number;
  balance: number;
  lastUpdatedAt: string;
}

export interface AdjustFundData {
  balance: number;
  totalRevenue: number;
  totalExpense: number;
}

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>("/transaction");
    return response.data;
  },

  async createTransaction(data: CreateTransactionData): Promise<string> {
    const response = await api.post<string>("/transaction", data);
    return response.data;
  },

  async approveTransaction(data: ApproveTransactionData): Promise<boolean> {
    const response = await api.post<boolean>("/transaction/approve", data);
    return response.data;
  },

  async getCategories(): Promise<TransactionCategory[]> {
    const response = await api.get<TransactionCategory[]>("/transaction/categories");
    return response.data;
  },

  async createCategory(data: CreateCategoryData): Promise<string> {
    const response = await api.post<string>("/transaction/categories", data);
    return response.data;
  },

  async updateCategory(id: string, data: CreateCategoryData): Promise<boolean> {
    const response = await api.put<boolean>(`/transaction/categories/${id}`, { id, ...data });
    return response.data;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const response = await api.delete<boolean>(`/transaction/categories/${id}`);
    return response.data;
  },

  async getFund(): Promise<ClubFundData> {
    const response = await api.get<ClubFundData>("/transaction/fund");
    return response.data;
  },

  async adjustFund(data: AdjustFundData): Promise<boolean> {
    const response = await api.post<boolean>("/transaction/adjust-fund", data);
    return response.data;
  },

  async updateTransaction(id: string, data: CreateTransactionData): Promise<boolean> {
    const response = await api.put<boolean>(`/transaction/${id}`, { id, ...data });
    return response.data;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const response = await api.delete<boolean>(`/transaction/${id}`);
    return response.data;
  },
};
