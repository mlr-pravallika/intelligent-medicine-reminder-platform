import api from "./api";

export type OcrMedicine = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time?: string;
  reminder_times?: string[];
  duration?: string;
  start_date?: string;
  end_date?: string;
  quantity?: number | null;
  total_quantity?: number | null;
  remaining_quantity?: number | null;
  tablets_per_day?: number;
  low_stock_threshold?: number;
  instructions?: string | null;
};

export type OcrResult = {
  medicines: OcrMedicine[];
  doctor_name?: string;
  hospital?: string;
  patient_name?: string;
  date?: string;
};

export type SaveOcrMedicine = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  start_date: string;
  end_date: string;
  instructions?: string | null;
  total_quantity: number;
  remaining_quantity: number;
  tablets_per_day: number;
  low_stock_threshold: number;
};

export type SaveOcrResponse = {
  success: boolean;
  message: string;
  saved_count: number;
  skipped_count: number;
  saved: Array<{
    id: number;
    medicine_name: string;
    dosage: string;
    frequency: string;
    reminder_time: string;
    start_date: string;
    end_date: string;
    total_quantity: number;
    remaining_quantity: number;
    tablets_per_day: number;
    low_stock_threshold: number;
  }>;
  skipped: Array<{
    medicine_name: string;
    reason: string;
    id?: number;
  }>;
};

export const scanPrescription = async (
  file: File,
): Promise<OcrResult> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post<OcrResult>(
    "/ocr/prescription",
    formData,
  );

  return response.data;
};

export const saveOcrMedicines = async (
  medicines: SaveOcrMedicine[],
): Promise<SaveOcrResponse> => {
  if (!medicines.length) {
    throw new Error(
      "No prescription medicines available to save.",
    );
  }

  const response =
    await api.post<SaveOcrResponse>(
      "/ocr/save-prescription",
      {
        medicines,
      },
    );

  return response.data;
};