import { Bell, Search, UserCircle2 } from "lucide-react";

function Navbar() {
  return (
    <div className="bg-white shadow-md rounded-2xl p-5 flex justify-between items-center">

      <div>

        <h1 className="text-3xl font-bold text-blue-700">
          Dashboard
        </h1>

        <p className="text-gray-500">
          Welcome back! Here's your medicine overview.
        </p>

      </div>

      <div className="flex items-center gap-5">

        <button className="relative">

          <Bell
            className="text-gray-600 hover:text-blue-600"
            size={24}
          />

          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>

        </button>

        <Search
          className="text-gray-600 hover:text-blue-600 cursor-pointer"
          size={24}
        />

        <div className="flex items-center gap-2">

          <UserCircle2
            className="text-blue-700"
            size={36}
          />

          <div>

            <h2 className="font-semibold">
              Pravallika
            </h2>

            <p className="text-xs text-gray-500">
              Patient
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Navbar;