import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addMedicine } from "../services/medicineService";

function AddMedicine() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        medicine_name: "",
        dosage: "",
        frequency: "",
        reminder_time: "",
        start_date: "",
        end_date: "",
        instructions: ""
    });

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addMedicine(form);

            alert("Medicine Added Successfully!");

            navigate("/medicines");

        } catch (error) {

            console.error(error);

            alert("Failed to add medicine.");

        }

    };

    return (

        <div className="max-w-3xl mx-auto p-8">

            <h1 className="text-3xl font-bold mb-6">
                Add Medicine
            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >

                <input
                    type="text"
                    name="medicine_name"
                    placeholder="Medicine Name"
                    className="w-full border rounded-lg p-3"
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="dosage"
                    placeholder="Dosage"
                    className="w-full border rounded-lg p-3"
                    onChange={handleChange}
                    required
                />

                <select
                    name="frequency"
                    className="w-full border rounded-lg p-3"
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Frequency</option>
                    <option>Daily</option>
                    <option>Twice Daily</option>
                    <option>Weekly</option>
                </select>

                <input
                    type="time"
                    name="reminder_time"
                    className="w-full border rounded-lg p-3"
                    onChange={handleChange}
                    required
                />

                <input
                    type="date"
                    name="start_date"
                    className="w-full border rounded-lg p-3"
                    onChange={handleChange}
                    required
                />

                <input
                    type="date"
                    name="end_date"
                    className="w-full border rounded-lg p-3"
                    onChange={handleChange}
                    required
                />

                <textarea
                    name="instructions"
                    placeholder="Instructions"
                    className="w-full border rounded-lg p-3"
                    rows="4"
                    onChange={handleChange}
                />

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                    Save Medicine
                </button>

            </form>

        </div>

    );

}

export default AddMedicine;