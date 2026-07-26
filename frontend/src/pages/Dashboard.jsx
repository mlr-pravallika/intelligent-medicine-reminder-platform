import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import StatCard from "../components/dashboard/StatCard";
import MedicineCard from "../components/dashboard/MedicineCard";

import {
    getDashboardStats,
    getDashboardMedicines
} from "../services/dashboardService";

function Dashboard() {

    const [stats, setStats] = useState({
        total_medicines: 0,
        active_medicines: 0,
        today_reminders: 0,
        expiring_soon: 0
    });

    const [medicines, setMedicines] = useState([]);

    useEffect(() => {
        loadDashboard();
        loadMedicines();
    }, []);

    // Dashboard Statistics
    const loadDashboard = async () => {

        try {

            const data = await getDashboardStats();

            setStats(data);

        } catch (error) {

            console.error("Dashboard Error:", error);

        }

    };

    // Dashboard Medicines
    const loadMedicines = async () => {

        try {

            const data = await getDashboardMedicines();

            setMedicines(data);

        } catch (error) {

            console.error("Medicine Error:", error);

        }

    };

    return (

        <div className="flex bg-gray-100 min-h-screen">

            <Sidebar />

            <div className="flex-1 p-8">

                <Navbar />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

                    <StatCard
                        title="Total Medicines"
                        value={stats.total_medicines}
                        color="border-blue-500"
                    />

                    <StatCard
                        title="Today's Reminders"
                        value={stats.today_reminders}
                        color="border-green-500"
                    />

                    <StatCard
                        title="Active Medicines"
                        value={stats.active_medicines}
                        color="border-yellow-500"
                    />

                    <StatCard
                        title="Expiring Soon"
                        value={stats.expiring_soon}
                        color="border-red-500"
                    />

                </div>

                <div className="mt-10">

                    <h2 className="text-2xl font-bold text-blue-700 mb-5">
                        Today's Medicines
                    </h2>

                    <div className="space-y-4">

                        {medicines.length === 0 ? (

                            <p className="text-gray-500">
                                No medicines available.
                            </p>

                        ) : (

                            medicines.map((medicine) => (

                                <MedicineCard
                                    key={medicine.id}
                                    medicine={medicine.medicine_name}
                                    dosage={medicine.dosage}
                                    time={medicine.reminder_time}
                                    status={
                                        medicine.is_active
                                            ? "Pending"
                                            : "Inactive"
                                    }
                                />

                            ))

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Dashboard;