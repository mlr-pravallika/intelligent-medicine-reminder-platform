import api from "./api";

export const getProfile = async () => {
  const response = await api.get("/me");
  return response.data;
};

export const updateProfile = async (
  userId: number,
  data: {
    name?: string;
    phone?: string;
  }
) => {
  const response = await api.put(`/profile/${userId}`, data);
  return response.data;
};