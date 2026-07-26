import api from "./api";

// ===============================
// Register User
// ===============================

export const registerUser = async (userData) => {
    const response = await api.post("/register", userData);
    return response.data;
};

// ===============================
// Login User
// ===============================

export const loginUser = async (loginData) => {
    const response = await api.post("/login", loginData);

    return response.data;
};

// ===============================
// Get Logged In User
// ===============================

export const getCurrentUser = async (token) => {

    const response = await api.get("/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

// ===============================
// Logout
// ===============================

export const logoutUser = () => {

    localStorage.removeItem("token");

};