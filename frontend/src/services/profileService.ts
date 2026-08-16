import api from "./api";


export interface ProfileUpdateData {
  name: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  height?: string | null;
  weight?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  preferred_language?: string | null;
  address?: string | null;
}


export const getProfile =
  async () => {
    const response =
      await api.get("/me");

    return response.data;
  };


export const updateProfile =
  async (
    userId: number,
    data: ProfileUpdateData,
  ) => {
    if (!userId) {
      throw new Error(
        "Invalid user id.",
      );
    }

    const response =
      await api.put(
        `/profile/${userId}`,
        data,
      );

    return response.data;
  };
