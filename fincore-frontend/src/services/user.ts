import api from "./api";
import { CreateUserData, CreateUserResponse } from "@/types/user";

export const userService = {
  async createUser(userData: CreateUserData): Promise<CreateUserResponse> {
    const response = await api.post<CreateUserResponse>("/user", userData);
    return response.data;
  },

  async getUsers(): Promise<any[]> {
    const response = await api.get<any[]>("/user");
    return response.data;
  },

  async updateUser(id: string, userData: CreateUserData): Promise<boolean> {
    const response = await api.put<boolean>(`/user/${id}`, { id, ...userData });
    return response.data;
  },

  async toggleLockUser(id: string, isActive: boolean): Promise<boolean> {
    const response = await api.post<boolean>("/user/lock", { id, isActive });
    return response.data;
  },

  async resetUserPassword(id: string): Promise<CreateUserResponse> {
    const response = await api.post<CreateUserResponse>(`/user/reset-password/${id}`);
    return response.data;
  },
};
