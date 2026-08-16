import api from "@/services/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;

  dob?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  height?: string | null;
  weight?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  preferred_language?: string | null;
  address?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/login",
    data
  );

  return response.data;
}

export async function registerUser(
  data: RegisterRequest
): Promise<User> {
  const response = await api.post<User>(
    "/register",
    data
  );

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>(
    "/me"
  );

  return response.data;
}

export async function forgotPassword(
  email: string
) {
  const response = await api.post(
    "/auth/forgot-password",
    {
      email,
    }
  );

  return response.data;
}

export async function verifyResetCode(
  email: string,
  code: string
) {
  const response = await api.post(
    "/auth/verify-reset-code",
    {
      email,
      code,
    }
  );

  return response.data;
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
) {
  const response = await api.post(
    "/auth/reset-password",
    {
      email,
      code,
      new_password: newPassword,
    }
  );

  return response.data;
}