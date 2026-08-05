import { createFileRoute, Link } from "@tanstack/react-router";
import { MailOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify Email — MediCare AI" },
      { name: "description", content: "Confirm your email address to activate your MediCare AI account." },
      { property: "og:title", content: "Verify Email — MediCare AI" },
      { property: "og:description", content: "Activate your MediCare AI account by verifying your email." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 text-center shadow-soft sm:p-8">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <MailOpen className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">Check your inbox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a verification link to <span className="font-semibold text-foreground">you@example.com</span>.
        Click the link to activate your MediCare AI account.
      </p>
      <div className="mt-6 space-y-3">
        <Button
          className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow"
          onClick={() => toast.info("Verification email resent")}
        >
          Resend verification email
        </Button>
        <Button variant="outline" asChild className="h-11 w-full rounded-xl font-semibold">
          <Link to="/auth/login">Continue to login</Link>
        </Button>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        Wrong address?{" "}
        <Link to="/auth/register" className="font-semibold text-primary hover:underline">
          Update your email
        </Link>
      </p>
    </Card>
  );
}
