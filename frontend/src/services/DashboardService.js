import api from "./api";

export const getDashboardStats = async () => {
    const response = await api.get("/dashboard/stats");

    console.log("Dashboard Stats Response:", response.data);

    return response.data;
};

export const getDashboardMedicines = async () => {
    const response = await api.get("/medicines");

    return response.data;
};