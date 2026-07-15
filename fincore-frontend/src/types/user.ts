export interface CreateUserData {
  fullName: string;
  email: string;
  phone?: string;
  role: number; // Enum UserRole: 1 = Admin, 2 = Member
}

export interface CreateUserResponse {
  userId: string;
  email: string;
  temporaryPassword: string;
}
