function StatCard({ title, value, color }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${color}`}
    >
      <h2 className="text-gray-500 text-sm">
        {title}
      </h2>

      <h1 className="text-3xl font-bold mt-2">
        {value}
      </h1>
    </div>
  );
}

export default StatCard;