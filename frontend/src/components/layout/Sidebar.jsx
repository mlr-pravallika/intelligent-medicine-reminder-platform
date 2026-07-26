import {
  LayoutDashboard,
  Pill,
  History,
  User,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";

function Sidebar() {

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {

    // Remove JWT Token
    localStorage.removeItem("token");

    // Redirect to Login
    navigate("/login", { replace: true });

  };

  return (

    <div className="w-64 h-screen bg-white border-r border-gray-200 shadow-lg flex flex-col">

      {/* Logo */}

      <div className="p-6 border-b">

        <div className="flex items-center gap-3">

          <div className="bg-blue-100 p-2 rounded-full">

              <img
                  src={logo}
                  alt="MediCare AI"
                  className="w-12 h-12"
              />

          </div>

          <div>

            <h1 className="font-bold text-blue-700 text-lg">
                MediCare AI
            </h1>

            <p className="text-xs text-gray-500">
                Intelligent Medication Platform
            </p>

          </div>

        </div>

      </div>

      {/* Menu */}

      <div className="flex-1 p-4">

        <ul className="space-y-2">

          {/* Dashboard */}

          <li>

            <button
              onClick={() => navigate("/dashboard")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                location.pathname === "/dashboard"
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-blue-50"
              }`}
            >

              <LayoutDashboard size={20} />

              Dashboard

            </button>

          </li>

          {/* Medicines */}

          <li>

            <button
              onClick={() => navigate("/medicines")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                location.pathname === "/medicines"
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-blue-50"
              }`}
            >

              <Pill size={20} />

              Medicines

            </button>

          </li>

          {/* History */}

          <li>

            <button
              onClick={() => navigate("/history")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                location.pathname === "/history"
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-blue-50"
              }`}
            >

              <History size={20} />

              History

            </button>

          </li>

          {/* Profile */}

          <li>

            <button
              onClick={() => navigate("/profile")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                location.pathname === "/profile"
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-blue-50"
              }`}
            >

              <User size={20} />

              Profile

            </button>

          </li>

        </ul>

      </div>

      {/* Logout */}

      <div className="p-4 border-t">

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition"
        >

          <LogOut size={20} />

          Logout

        </button>

      </div>

    </div>

  );

}

export default Sidebar;