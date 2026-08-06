import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { askAssistant } from "@/services/assistantService";
import { toast } from "sonner";
import { SectionHeading } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — MediCare AI" },
      { name: "description", content: "Ask about medicines, dosage, safety tips, adherence and refill recommendations." },
      { property: "og:title", content: "AI Assistant — MediCare AI" },
      { property: "og:description", content: "Natural language medication assistant with health insights." },
    ],
  }),
  component: AssistantPage,
});

const prompts = [
  "Explain what Metformin does",
  "Is my Atorvastatin dosage typical?",
  "How can I improve my evening adherence?",
  "When should I refill my medicines?",
  "Any safety tips for Levothyroxine?",
  "Summarise my medication usage this month",
];

type Message = { id: number; role: "user" | "ai"; text: string };

const seed: Message[] = [];

const capabilities = [
  "Medicine explanation",
  "Dosage explanation",
  "Drug usage summary",
  "Reminder optimization",
  "Adherence suggestions",
  "Medicine safety tips",
  "Health insights",
  "AI refill recommendation",
];

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(seed);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {

      setLoading(true);

      const response = await askAssistant(text);

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: response.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {

      console.error(error);

      toast.error("Unable to contact AI Assistant");

    }finally {

      setLoading(false);

    } 
  };

  return (
    <div className="space-y-6">
      <SectionHeading title="AI medication assistant" description="Natural language answers grounded in your medication history." />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="flex h-[36rem] flex-col gap-0 rounded-2xl border-border/70 p-0 shadow-soft">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="bg-brand-gradient grid size-10 place-items-center rounded-xl text-primary-foreground">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
              MediCare AI Assistant
              </p>

              <p className="truncate text-xs text-accent">
              Secure • Connected to your health records
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 px-5 py-4">
            <ul className="space-y-4">

            {messages.length === 0 ? (

            <div className="flex h-72 flex-col items-center justify-center text-center">

            <Bot className="mb-4 h-12 w-12 text-primary" />

            <h3 className="text-lg font-semibold">

            Welcome to MediCare AI

            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">

            Ask questions about your medicines, reminders, dosage,
            drug safety, refill prediction, or your medication history.

            </p>

            </div>

            ) : (

            messages.map((m) => (
                <li key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      m.role === "ai" ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent",
                    )}
                  >
                    {m.role === "ai" ? <Bot className="size-4" aria-hidden="true" /> : <UserRound className="size-4" aria-hidden="true" />}
                  </span>
                  <p
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "ai" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
                    )}
                  >
                    {m.text}
                  </p>
                </li>
            ))
            )}    
            </ul>
          </ScrollArea>

          <form
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a medicine, dosage or your adherence…"
              aria-label="Message the AI assistant"
              className="h-11 rounded-full"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={loading}
              className="bg-brand-gradient size-11 rounded-full shadow-glow"
            >
              {loading ? "..." : <Send className="size-4" />}
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Suggested prompts" />
            <ul className="mt-4 space-y-2">
              {prompts.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => send(p)}
                    className="w-full rounded-xl border border-border/70 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Assistant capabilities" />
            <ul className="mt-4 flex flex-wrap gap-2">
              {capabilities.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="size-3" aria-hidden="true" /> {c}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
