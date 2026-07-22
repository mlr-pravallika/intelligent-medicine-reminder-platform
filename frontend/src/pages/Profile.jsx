import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import {
    getProfile,
    updateProfile
} from "../services/profileService";

function Profile() {

    const [profile, setProfile] = useState({
        id: "",
        name: "",
        email: "",
        phone: ""
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {

        try {

            const data = await getProfile();

            setProfile({
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone || ""
            });

        } catch (error) {

            console.error(error);

            alert("Failed to load profile.");

        } finally {

            setLoading(false);

        }

    };

    const handleChange = (e) => {

        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await updateProfile(profile.id, {
                name: profile.name,
                phone: profile.phone
            });

            alert("Profile updated successfully!");

        } catch (error) {

            console.error(error);

            alert("Failed to update profile.");

        }

    };

    if (loading) {

        return <h2 className="p-6">Loading Profile...</h2>;

    }

    return (

        <div className="flex bg-gray-100 min-h-screen">

            <Sidebar />

            <div className="flex-1 p-8">

                <Navbar />

                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">

                    <h1 className="text-3xl font-bold text-blue-700 mb-6">
                        My Profile
                    </h1>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        <div>

                            <label className="block font-semibold mb-2">
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3"
                            />

                        </div>

                        <div>

                            <label className="block font-semibold mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                value={profile.email}
                                readOnly
                                className="w-full border rounded-lg p-3 bg-gray-100"
                            />

                        </div>

                        <div>

                            <label className="block font-semibold mb-2">
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={profile.phone}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3"
                            />

                        </div>

                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                        >
                            Update Profile
                        </button>

                    </form>

                </div>

            </div>

        </div>

    );

}

export default Profile;