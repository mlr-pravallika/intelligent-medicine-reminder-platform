import api from "./api";

export const getTodayMedicines = async () => {
  const response = await api.get("/calendar/today");
  return response.data;
};

export const getAppointments = async () => {
  const response = await api.get("/calendar/appointments");
  return response.data;
};

export const getRefills = async () => {
  const response = await api.get("/calendar/refills");
  return response.data;
};