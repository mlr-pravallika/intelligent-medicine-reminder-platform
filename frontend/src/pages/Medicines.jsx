import { useEffect, useState } from "react";
import {
    getMedicines,
    deleteMedicine,
    toggleMedicine
} from "../services/medicineService";
import { useNavigate } from "react-router-dom";

function Medicines() {

    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {

        loadMedicines();

    }, []);

    const loadMedicines = async () => {

        try {

            const data = await getMedicines();

            setMedicines(data);

        } catch (error) {

            console.error(error);

            alert("Failed to load medicines.");

        } finally {

            setLoading(false);

        }

    };

    const filteredMedicines = medicines.filter((medicine) =>
        medicine.medicine_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // Delete Medicine
    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this medicine?"
        );

        if (!confirmDelete) return;

        try {

            await deleteMedicine(id);

            alert("Medicine deleted successfully!");

            // Refresh medicines after delete
            loadMedicines();

        } catch (error) {

            console.error(error);

            alert("Failed to delete medicine.");

        }

    };

    const handleToggle = async (id) => {

        try {

            await toggleMedicine(id);

            loadMedicines();

        }

        catch (error) {

            console.error(error);

        }

    };

    const handleEdit = (medicine) => {

        navigate(`/edit-medicine/${medicine.id}`);

    };
    

    if (loading) {
        return <h2 className="p-6">Loading Medicines...</h2>;
    }

    return (

        <div className="p-6">

            {/* Header */}

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

                <h1 className="text-3xl font-bold">
                    My Medicines
                </h1>

                <div className="flex gap-3">

                    <input
                        type="text"
                        placeholder="🔍 Search medicine..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border rounded-lg px-4 py-2 w-64"
                    />

                    <button
                        onClick={() => navigate("/add-medicine")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                        + Add Medicine
                    </button>

                    <button
                        onClick={() => handleEdit(medicine)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Edit
                    </button>

                </div>

            </div>

            {filteredMedicines.length === 0 ? (

                <div className="bg-gray-100 rounded-lg p-8 text-center">

                    <h2 className="text-xl font-semibold">
                        No Medicines found
                    </h2>

                    <p className="text-gray-500 mt-2">
                        Try searching with another medicine name.
                    </p>

                </div>

            ) : (

                <div className="overflow-x-auto">

                    <table className="w-full border border-gray-300">

                        <thead className="bg-blue-600 text-white">

                            <tr>

                                <th className="p-3 text-left">Medicine</th>
                                <th className="p-3 text-left">Dosage</th>
                                <th className="p-3 text-left">Frequency</th>
                                <th className="p-3 text-left">Reminder</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Actions</th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredMedicines.map((medicine) => (

                                <tr
                                    key={medicine.id}
                                    className="border-b hover:bg-gray-50"
                                >

                                    <td className="p-3">
                                        {medicine.medicine_name}
                                    </td>

                                    <td className="p-3">
                                        {medicine.dosage}
                                    </td>

                                    <td className="p-3">
                                        {medicine.frequency}
                                    </td>

                                    <td className="p-3">
                                        {medicine.reminder_time}
                                    </td>

                                    <td className="p-3 text-center">

                                        <p
                                            className={`font-semibold ${
                                                medicine.is_active
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {medicine.is_active
                                                ? "🟢 Active"
                                                : "🔴 Paused"}
                                        </p>

                                    </td>

                                    <td className="p-3">

                                        <div className="flex gap-2">

                                        <button
                                            onClick={() => handleEdit(medicine)}
                                            className="bg-blue-500 text-white px-4 py-2 rounded"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(medicine.id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded"
                                        >
                                            Delete
                                        </button>

                                        <button
                                            onClick={() => handleToggle(medicine.id)}
                                            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                                                medicine.is_active
                                                    ? "bg-orange-500 hover:bg-orange-600"
                                                    : "bg-green-600 hover:bg-green-700"
                                            }`}
                                        >
                                            {medicine.is_active
                                                ? "Pause"
                                                : "Resume"}
                                        </button>

                                    </div>    

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </div>

    );

}

export default Medicines;