import api from "./api";

export const googleLogin = async (credential: string) => {

    const response = await api.post("/auth/google", {
        credential,
    });

    return response.data;
};