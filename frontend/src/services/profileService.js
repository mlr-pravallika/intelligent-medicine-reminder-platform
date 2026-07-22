import api from "./api";

export const getProfile = async () => {
    const response = await api.get("/me");
    return response.data;
};

export const updateProfile = async (userId, profile) => {
    const response = await api.put(`/profile/${userId}`, profile);
    return response.data;
};