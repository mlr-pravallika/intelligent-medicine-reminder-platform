import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — MediCare AI" },
      { name: "description", content: "Choose a new password for your MediCare AI account." },
      { property: "og:title", content: "Reset Password — MediCare AI" },
      { property: "og:description", content: "Set a new secure password for MediCare AI." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <KeyRound className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Set a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Your new password must be different from previously used passwords.
      </p>
      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Password updated — please sign in");
          navigate({ to: "/auth/login" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" required placeholder="••••••••" className="h-11 rounded-xl" />
          <div className="pt-1">
            <Progress value={72} className="h-1.5" />
            <p className="mt-1.5 text-xs text-muted-foreground">Password strength: strong</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type="password" required placeholder="••••••••" className="h-11 rounded-xl" />
        </div>
        <Button type="submit" className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow">
          Update password
        </Button>
      </form>
    </Card>
  );
}
