import api from "./api";

export const getReminderHistory = async () => {

    const response = await api.get("/history");

    return response.data;

};
