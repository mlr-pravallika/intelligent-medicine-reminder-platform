import { Pill, Clock } from "lucide-react";

function MedicineCard({ medicine, dosage, time, status }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex justify-between items-center">

      <div className="flex items-center gap-4">

        <div className="bg-blue-100 p-3 rounded-full">

          <Pill className="text-blue-700" />

        </div>

        <div>

          <h2 className="font-semibold">
            {medicine}
          </h2>

          <p className="text-gray-500">
            {dosage}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-6">

        <div className="flex items-center gap-2">

          <Clock
            size={18}
            className="text-blue-600"
          />

          {time}

        </div>

        <span
          className={`px-3 py-1 rounded-full text-white ${
            status === "Taken"
              ? "bg-green-500"
              : "bg-yellow-500"
          }`}
        >
          {status}
        </span>

      </div>

    </div>
  );
}

export default MedicineCard;