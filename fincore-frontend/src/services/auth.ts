import api from "./api";
import { LoginCredentials, LoginResponse, ChangePasswordData } from "@/types/auth";

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    const data = response.data;
    if (data.token) {
      localStorage.setItem("fincore_token", data.token);
      localStorage.setItem(
        "fincore_user",
        JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          isPasswordTemp: data.isPasswordTemp,
        })
      );
    }
    return data;
  },

  async changePassword(data: ChangePasswordData): Promise<boolean> {
    const response = await api.post<boolean>("/auth/change-password", data);
    
    // Update local user state isPasswordTemp to false after successful reset
    if (response.data) {
      const userStr = localStorage.getItem("fincore_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.isPasswordTemp = false;
        localStorage.setItem("fincore_user", JSON.stringify(user));
      }
    }
    
    return response.data;
  },

  async forgotPassword(email: string): Promise<boolean> {
    const response = await api.post<boolean>("/auth/forgot-password", { email });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem("fincore_token");
    localStorage.removeItem("fincore_user");
  },

  getCurrentUser() {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("fincore_user");
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("fincore_token");
    }
    return false;
  },
};
