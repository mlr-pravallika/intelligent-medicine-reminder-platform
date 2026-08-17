import axios from "axios";


// ============================================================
// OCR TYPES
// ============================================================

import api from "./api";

export interface OcrMedicine {
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
  instructions?: string | null;
}

export interface OcrResult {
  medicines: OcrMedicine[];
  doctor_name?: string;
  hospital?: string;
  patient_name?: string;
  date?: string;
}


// ============================================================
// SAVE TYPES
// ============================================================

export interface SaveOcrMedicine {
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
  low_stock_threshold: number;
}

export interface SaveOcrResponse {
  message: string;
  saved_count: number;
  skipped_count: number;
  saved: Array<{
    id: number;
    medicine_name: string;
  }>;
  skipped: Array<{
    medicine_name: string;
    reason: string;
    id?: number;
  }>;
}


// ============================================================
// HELPERS
// ============================================================

function getAuthHeaders() {
  const token = localStorage.getItem(
    "access_token",
  );

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}


// ============================================================
// SCAN PRESCRIPTION
// ============================================================

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


// ============================================================
// SAVE ALL OCR MEDICINES
// ============================================================

export async function saveOcrMedicines(
  medicines: SaveOcrMedicine[],
): Promise<SaveOcrResponse> {
  if (!medicines.length) {
    throw new Error(
      "No medicines to save.",
    );
  }

  const response =
    await axios.post<SaveOcrResponse>(
      "http://localhost:8000/ocr/save-prescription",
      {
        medicines,
      },
      {
        timeout: 30000,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      },
    );

  return response.data;
}
