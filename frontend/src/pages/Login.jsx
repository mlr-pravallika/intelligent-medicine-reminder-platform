import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Pill,
} from "lucide-react";

import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================
  // Login Function
  // ==========================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Frontend Validation
    if (!email || !password) {
        setError("Please fill all fields");
        return;
    }

    setLoading(true);

    try {
        const response = await loginUser({
            email,
            password,
        });

      localStorage.setItem(
        "token",
        response.access_token
      );

      alert("Login Successful ✅");

      navigate("/dashboard", {
          replace: true,
      });

    } catch (err) {

      console.log(err);

      setError(
        err.response?.data?.detail ||
          "Login Failed"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 flex items-center justify-center px-4">

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 p-8">

        {/* Logo */}

        <div className="flex justify-center">

          <div className="bg-blue-100 p-4 rounded-full">

            <Pill
              className="text-blue-700"
              size={35}
            />

          </div>

        </div>

        <h1 className="text-3xl font-bold text-center text-blue-700 mt-5">

          Medicine Reminder

        </h1>

        <p className="text-center text-gray-500 mt-2">

          Intelligent Healthcare Platform

        </p>

        <p className="text-center text-gray-400 text-sm mt-1">

          Welcome back! Please login to continue.

        </p>

        {error && (

          <div className="bg-red-100 text-red-600 p-3 rounded-lg mt-5">

            {error}

          </div>

        )}

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-6"
        >

          {/* Email */}

          <div>

            <label className="block mb-2 font-medium">

              Email

            </label>

            <div className="relative">

              <Mail
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

            </div>

          </div>

          {/* Password */}

          <div>

            <label className="block mb-2 font-medium">

              Password

            </label>

            <div className="relative">

              <Lock
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full border rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >

                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}

              </button>

            </div>

          </div>

          <div className="text-right">

            <a
              href="#"
              className="text-sm text-blue-600 hover:underline"
            >

              Forgot Password?

            </a>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
          >

            {loading
              ? "Logging In..."
              : "Login"}

          </button>

        </form>

        <div className="mt-8 text-center">

          <p className="text-gray-500">

            Don't have an account?

          </p>

          <button
            onClick={() =>
              navigate("/register")
            }
            className="text-blue-700 font-semibold hover:underline"
          >

            Create Account

          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;