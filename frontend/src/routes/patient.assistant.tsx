import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";

import { askAssistant } from "@/services/assistantService";

import { SectionHeading } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { cn } from "@/lib/utils";
import { toast } from "sonner";


export const Route = createFileRoute(
  "/patient/assistant",
)({
  head: () => ({
    meta: [
      {
        title:
          "AI Assistant - MediCare AI",
      },
      {
        name: "description",
        content:
          "Ask questions about medicines, dosage, reminders, adherence and medication history.",
      },
      {
        property: "og:title",
        content:
          "AI Assistant - MediCare AI",
      },
      {
        property: "og:description",
        content:
          "Medication assistant connected to your medication data.",
      },
    ],
  }),

  component: AssistantPage,
});


const prompts = [
  "Explain what Metformin does",
  "What is my current medicine schedule",
  "How can I improve my medication adherence",
  "When should I refill my medicines",
  "Give me safety information about my medicines",
  "Summarize my medication history",
];


const capabilities = [
  "Medicine explanation",
  "Dosage explanation",
  "Medication schedule",
  "Adherence guidance",
  "Safety information",
  "Refill guidance",
];


type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
};


function sanitizeAssistantText(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "The assistant did not return a response.";
  }

  let text = String(value);

  // Remove markdown and formatting characters so responses stay
  // clean and readable in the chat bubble.
  text = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[`*_#~>|]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();

  return text || "The assistant did not return a response.";
}


function extractAssistantText(
  response: unknown,
): string {
  if (
    typeof response === "string"
  ) {
    return sanitizeAssistantText(
      response,
    );
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return "The assistant did not return a response.";
  }

  const data =
    response as Record<
      string,
      unknown
    >;

  const candidates = [
    data.reply,
    data.answer,
    data.response,
    data.message,
    data.text,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {
      return sanitizeAssistantText(
        candidate,
      );
    }
  }

  return "The assistant could not generate a readable response.";
}


function AssistantPage() {
  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  const send = async (
    rawText: string,
  ) => {
    const text =
      rawText.trim();

    if (
      !text ||
      loading
    ) {
      return;
    }

    const userMessage: Message =
      {
        id: Date.now(),
        role: "user",
        text,
      };

    setMessages(
      current => [
        ...current,
        userMessage,
      ],
    );

    setInput("");
    setLoading(true);

    try {
      const response =
        await askAssistant(
          text,
        );

      const answer =
        extractAssistantText(
          response,
        );

      const aiMessage: Message =
        {
          id:
            Date.now() + 1,
          role: "ai",
          text: answer,
        };

      setMessages(
        current => [
          ...current,
          aiMessage,
        ],
      );

    } catch (error) {
      console.error(
        "Assistant error:",
        error,
      );

      const errorMessage =
        error &&
        typeof error ===
          "object" &&
        "response" in error
          ? (
              error as {
                response?: {
                  data?: {
                    detail?: unknown;
                  };
                };
              }
            ).response?.data
              ?.detail
          : null;

      const cleanError =
        typeof errorMessage ===
        "string"
          ? sanitizeAssistantText(
              errorMessage,
            )
          : "The AI service is temporarily unavailable. Please try again.";

      setMessages(
        current => [
          ...current,
          {
            id:
              Date.now() + 1,
            role: "ai",
            text: cleanError,
          },
        ],
      );

      toast.error(
        "Unable to contact the AI assistant.",
      );

    } finally {
      setLoading(false);
    }
  };


  const submitMessage = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    void send(input);
  };


  return (
    <div className="space-y-6">

      <SectionHeading
        title="AI medication assistant"
        description="Get clear answers based on your medication information and reminder history."
      />


      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">

        <Card className="flex h-[36rem] flex-col gap-0 rounded-2xl border-border/70 p-0 shadow-soft">

          <div className="flex items-center gap-3 border-b border-border px-5 py-4">

            <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-primary-foreground">

              <Bot
                className="size-5"
                aria-hidden="true"
              />

            </span>

            <div className="min-w-0">

              <p className="truncate text-sm font-bold text-foreground">
                MediCare AI Assistant
              </p>

              <p className="truncate text-xs text-accent">
                Connected to your medication records
              </p>

            </div>

          </div>


          <ScrollArea className="flex-1 px-5 py-4">

            <div className="min-h-full">

              {messages.length ===
                0 ? (

                <div className="flex min-h-[25rem] flex-col items-center justify-center px-5 text-center">

                  <Bot className="mb-4 size-12 text-primary" />

                  <h3 className="text-lg font-semibold">
                    Welcome to MediCare AI
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Ask about your medicines, dosage, schedule, adherence, safety, or refill information.
                  </p>

                </div>

              ) : (

                <ul className="space-y-4">

                  {messages.map(
                    message => (
                      <li
                        key={
                          message.id
                        }
                        className={cn(
                          "flex gap-3",
                          message.role ===
                            "user" &&
                            "flex-row-reverse",
                        )}
                      >

                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-full",
                            message.role ===
                              "ai"
                              ? "bg-primary-soft text-primary"
                              : "bg-accent-soft text-accent",
                          )}
                        >

                          {message.role ===
                          "ai" ? (
                            <Bot
                              className="size-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <UserRound
                              className="size-4"
                              aria-hidden="true"
                            />
                          )}

                        </span>


                        <div
                          className={cn(
                            "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
                            message.role ===
                              "ai"
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {message.text}
                        </div>

                      </li>
                    ),
                  )}


                  {loading && (
                    <li className="flex gap-3">

                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">

                        <Bot
                          className="size-4"
                          aria-hidden="true"
                        />

                      </span>

                      <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                        Thinking...
                      </div>

                    </li>
                  )}

                </ul>

              )}

            </div>

          </ScrollArea>


          <form
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-border p-4"
            onSubmit={
              submitMessage
            }
          >

            <Input
              value={input}
              onChange={event =>
                setInput(
                  event.target.value,
                )
              }
              placeholder="Ask about a medicine, dosage, adherence or refill..."
              aria-label="Message the AI assistant"
              className="h-11 rounded-full"
              disabled={loading}
            />

            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={
                loading ||
                !input.trim()
              }
              className="size-11 rounded-full bg-brand-gradient shadow-glow"
            >

              {loading ? (
                <span className="text-xs">
                  ...
                </span>
              ) : (
                <Send className="size-4" />
              )}

            </Button>

          </form>

        </Card>


        <div className="space-y-5">

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Suggested prompts"
              description="Start with one of these questions"
            />

            <ul className="mt-4 space-y-2">

              {prompts.map(
                prompt => (
                  <li
                    key={prompt}
                  >

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        void send(
                          prompt,
                        )
                      }
                      className="w-full rounded-xl border border-border/70 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>

                  </li>
                ),
              )}

            </ul>

          </Card>


          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Assistant capabilities"
              description="Useful medication support"
            />

            <ul className="mt-4 flex flex-wrap gap-2">

              {capabilities.map(
                capability => (
                  <li
                    key={
                      capability
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                  >

                    <Sparkles
                      className="size-3"
                      aria-hidden="true"
                    />

                    {capability}

                  </li>
                ),
              )}

            </ul>

          </Card>

        </div>

      </div>

    </div>
  );
}
