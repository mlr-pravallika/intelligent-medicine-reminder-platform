import { CheckCircle2 } from "lucide-react";

function ProgressCard() {
  const completed = 3;
  const total = 4;

  const percentage = (completed / total) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <div className="flex items-center gap-2 mb-4">

        <CheckCircle2
          className="text-green-600"
          size={24}
        />

        <h2 className="text-xl font-bold">
          Today's Progress
        </h2>

      </div>

      <h1 className="text-4xl font-bold text-blue-700">
        {percentage}%
      </h1>

      <div className="w-full bg-gray-200 rounded-full h-4 mt-5">

        <div
          className="bg-green-500 h-4 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>

      </div>

      <p className="mt-4 text-gray-600">

        {completed} of {total} medicines completed

      </p>

      <p className="text-green-600 font-semibold mt-2">

        Excellent Progress 🎉

      </p>

    </div>
  );
}

export default ProgressCard;