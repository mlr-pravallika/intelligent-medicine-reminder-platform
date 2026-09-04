import {
  createContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  type User,
} from "@/services/authService";

import { googleLogin } from "@/services/googleAuthService";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext =
  createContext<AuthContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: Props) {

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const loadUser = async () => {

      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {

        const profile =
          await getCurrentUser();

        setUser(profile);

      } catch {

        localStorage.removeItem(
          "access_token"
        );

        sessionStorage.removeItem(
          "access_token"
        );

        setUser(null);

      } finally {

        setLoading(false);

      }
    };

    loadUser();

  }, []);

  const login = async (
    data: LoginData
  ) => {

    const response =
      await loginUser(data);

    localStorage.setItem(
      "access_token",
      response.access_token
    );

    const profile =
      await getCurrentUser();

    setUser(profile);

    return profile;
  };

  const loginWithGoogle =
    async (credential: string) => {

      const response =
        await googleLogin(credential);

      localStorage.setItem(
        "access_token",
        response.access_token
      );

      const profile =
        await getCurrentUser();

      setUser(profile);

      return profile;
    };

  const register = async (
    data: RegisterData
  ) => {

    return registerUser(data);
  };

  const logout = () => {

    localStorage.removeItem(
      "access_token"
    );

    sessionStorage.removeItem(
      "access_token"
    );

    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      isAuthenticated: !!user,
    }),
    [
      user,
      loading,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}