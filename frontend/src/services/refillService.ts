import api from "./api";

export async function getRefillStatus() {

    const response = await api.get("/refill/status");

    return response.data;

}