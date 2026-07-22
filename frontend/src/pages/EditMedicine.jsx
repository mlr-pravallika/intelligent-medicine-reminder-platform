import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    getMedicineById,
    updateMedicine
} from "../services/medicineService";

function EditMedicine() {

    const { id } = useParams();

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

    useEffect(() => {

        loadMedicine();

    }, []);

    const loadMedicine = async () => {

        try {

            const data = await getMedicineById(id);

            setForm(data);

        } catch (error) {

            console.error(error);

            alert("Failed to load medicine.");

        }

    };

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await updateMedicine(id, form);

            alert("Medicine Updated Successfully!");

            navigate("/medicines");

        }

        catch (error) {

            console.error(error);

            alert("Failed to update medicine.");

        }

    };

    return (

        <div className="max-w-3xl mx-auto p-8">

            <h1 className="text-3xl font-bold mb-6">

                Edit Medicine

            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >

                <input
                    type="text"
                    name="medicine_name"
                    value={form.medicine_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                />

                <input
                    type="text"
                    name="dosage"
                    value={form.dosage}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                />

                <select
                    name="frequency"
                    value={form.frequency}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                >

                    <option>Daily</option>
                    <option>Twice Daily</option>
                    <option>Weekly</option>

                </select>

                <input
                    type="time"
                    name="reminder_time"
                    value={form.reminder_time}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                />

                <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                />

                <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                />

                <textarea
                    name="instructions"
                    value={form.instructions}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3"
                    rows="4"
                />

                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                >

                    Update Medicine

                </button>

            </form>

        </div>

    );

}

export default EditMedicine;