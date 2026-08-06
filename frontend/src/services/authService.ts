import api from "./api";

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

export const loginUser = async (data: LoginRequest) => {
  const response = await api.post("/login", data);
  return response.data;
};

export const registerUser = async (data: RegisterRequest) => {
  const response = await api.post("/register", data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/me");
  return response.data;
};