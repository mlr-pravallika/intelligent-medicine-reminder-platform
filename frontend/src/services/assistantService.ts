import api from "./api";

export const askAssistant = async (message: string) => {
  const response = await api.post("/assistant/chat", {
    message,
  });

  return response.data;
};