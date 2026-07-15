export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  isPasswordTemp: boolean;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface UserSession {
  email: string;
  fullName: string;
  role: "Admin" | "Member";
  isPasswordTemp: boolean;
}
