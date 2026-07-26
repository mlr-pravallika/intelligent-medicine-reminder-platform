import { Clock3 } from "lucide-react";

function ReminderCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <div className="flex items-center gap-2 mb-4">

        <Clock3 className="text-blue-600" />

        <h2 className="text-xl font-bold">
          Upcoming Reminder
        </h2>

      </div>

      <div className="space-y-3">

        <div>
          <p className="text-gray-500 text-sm">
            Medicine
          </p>

          <h3 className="font-semibold">
            Calcium
          </h3>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Dosage
          </p>

          <h3 className="font-semibold">
            600 mg
          </h3>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Time
          </p>

          <h3 className="font-semibold">
            01:00 PM
          </h3>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Status
          </p>

          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
            Pending
          </span>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Remaining
          </p>

          <h3 className="text-red-500 font-bold">
            45 Minutes
          </h3>
        </div>

      </div>

    </div>
  );
}

export default ReminderCard;