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
} from "@/services/authService";
import { googleLogin } from "@/services/googleAuthService";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

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
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser();
        setUser(profile);
      } catch (error) {
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (data: LoginData) => {
    try {
      console.log("Logging in...");

      const response = await loginUser(data);

      console.log("Login Response:", response);

      localStorage.setItem(
        "access_token",
        response.access_token
      );

      const profile = await getCurrentUser();

      console.log("Profile:", profile);

      setUser(profile);

      return profile;
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await googleLogin(credential);

      localStorage.setItem(
        "access_token",
        response.access_token
      );

      const profile = await getCurrentUser();

      setUser(profile);

      return profile;
    } catch (error) {
      console.error("GOOGLE LOGIN ERROR:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    await registerUser(data);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
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
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}