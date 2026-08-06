import api from "./api";
import type { Medicine } from "@/types/medicine";

export interface MedicineData {
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  start_date: string;
  end_date: string;
  instructions?: string;

  total_quantity: number;
  remaining_quantity: number;
  tablets_per_day: number;
}

export const addMedicine = async (data: MedicineData): Promise<Medicine> => {
  const response = await api.post("/medicines", data);
  return response.data;
};

export const getMedicines = async (): Promise<Medicine[]> => {
  const response = await api.get("/medicines");
  return response.data;
};

export const getMedicine = async (id: number): Promise<Medicine> => {
  const response = await api.get(`/medicines/${id}`);
  return response.data;
};

export const updateMedicine = async (
  id: number,
  data: MedicineData
): Promise<Medicine> => {
  const response = await api.put(`/medicines/${id}`, data);
  return response.data;
};

export const toggleMedicine = async (id: number): Promise<Medicine> => {
  const response = await api.patch(`/medicines/${id}/toggle`);
  return response.data;
};

export const deleteMedicine = async (id: number): Promise<void> => {
  await api.delete(`/medicines/${id}`);
};

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const saveMedicines = async (medicines: any[]) => {

    const response = await api.post(
        "/ocr/save-prescription",
        {
            medicines
        }
    );

    return response.data;
};