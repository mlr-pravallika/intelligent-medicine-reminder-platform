import api from "./api";


export interface AssistantResponse {
  reply: string;
  answer?: string;
}


function cleanResponse(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  let text = String(value);

  // Remove markdown-style formatting so the chat UI remains clean.
  text = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[*_`#~>|]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}


export const askAssistant =
  async (
    message: string,
  ): Promise<AssistantResponse> => {
    const question =
      message.trim();

    if (!question) {
      throw new Error(
        "Please enter a question.",
      );
    }

    const response =
      await api.post(
        "/assistant/chat",
        {
          message: question,
        },
      );

    const data =
      response.data ?? {};

    const reply =
      cleanResponse(
        data.reply ??
          data.answer ??
          data.response ??
          data.message ??
          "",
      );

    if (!reply) {
      throw new Error(
        "The AI assistant returned an empty response.",
      );
    }

    return {
      reply,
    };
  };
