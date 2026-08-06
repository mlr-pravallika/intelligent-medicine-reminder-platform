import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — MediCare AI" },
      { name: "description", content: "Request a secure verification code to reset your MediCare AI password." },
      { property: "og:title", content: "Forgot Password — MediCare AI" },
      { property: "og:description", content: "Reset your MediCare AI account password securely." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <MailCheck className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Forgot password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter your registered email and we'll send a 6-digit verification code.
      </p>
      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Verification code sent");
          navigate({ to: "/auth/verify-otp" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="fp-email">Email address</Label>
          <Input id="fp-email" type="email" required placeholder="you@example.com" className="h-11 rounded-xl" />
        </div>
        <Button type="submit" className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow">
          Send verification code
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
