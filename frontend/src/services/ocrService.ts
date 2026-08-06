import api from "./api";

export const scanPrescription = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/ocr/prescription",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const savePrescription = async (data: any) => {

    const response = await api.post(
        "/ocr/save-prescription",
        data
    );

    return response.data;
};