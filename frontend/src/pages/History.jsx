import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import { getReminderHistory } from "../services/historyService";

function History() {

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadHistory();

    }, []);

    const loadHistory = async () => {

        try {

            const data = await getReminderHistory();

            setHistory(data);

        } catch (error) {

            console.error(error);

            alert("Failed to load reminder history.");

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h2 className="p-6">Loading Reminder History...</h2>;

    }

    return (

        <div className="flex bg-gray-100 min-h-screen">

            <Sidebar />

            <div className="flex-1 p-8">

                <Navbar />

                <h1 className="text-3xl font-bold text-blue-700 mb-6">
                    Reminder History
                </h1>

                {history.length === 0 ? (

                    <div className="bg-white rounded-xl shadow-md p-8 text-center">

                        <h2 className="text-xl font-semibold">
                            No Reminder History Found
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Reminder history will appear here after reminders are sent.
                        </p>

                    </div>

                ) : (

                    <div className="bg-white rounded-xl shadow-md overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-blue-600 text-white">

                                <tr>

                                    <th className="p-4 text-left">Medicine</th>
                                    <th className="p-4 text-left">Dosage</th>
                                    <th className="p-4 text-left">Reminder Time</th>
                                    <th className="p-4 text-left">Status</th>
                                    <th className="p-4 text-left">Sent At</th>

                                </tr>

                            </thead>

                            <tbody>

                                {history.map((item) => (

                                    <tr
                                        key={item.id}
                                        className="border-b hover:bg-gray-50"
                                    >

                                        <td className="p-4">
                                            {item.medicine_name}
                                        </td>

                                        <td className="p-4">
                                            {item.dosage}
                                        </td>

                                        <td className="p-4">
                                            {item.reminder_time}
                                        </td>

                                        <td className="p-4">

                                            <span
                                                className={`px-3 py-1 rounded-full text-white text-sm ${
                                                    item.status === "Sent"
                                                        ? "bg-green-500"
                                                        : "bg-red-500"
                                                }`}
                                            >
                                                {item.status}
                                            </span>

                                        </td>

                                        <td className="p-4">
                                            {item.sent_at}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );

}

export default History;