import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verify OTP — MediCare AI" },
      { name: "description", content: "Enter the 6-digit verification code sent to your registered email or phone." },
      { property: "og:title", content: "Verify OTP — MediCare AI" },
      { property: "og:description", content: "Two-step verification for MediCare AI accounts." },
    ],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <ShieldCheck className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Verify your code</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We sent a 6-digit code to e•••••@example.com. It expires in 10 minutes.
      </p>
      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Code verified");
          navigate({ to: "/auth/reset-password" });
        }}
      >
        <div className="space-y-3">
          <Label htmlFor="otp-input">Verification code</Label>
          <InputOTP maxLength={6} id="otp-input" containerClassName="justify-between">
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="size-12 rounded-xl border-border text-lg font-bold" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow">
          Verify code
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Didn't receive it?{" "}
        <button
          type="button"
          onClick={() => toast.info("A new code has been sent")}
          className="font-semibold text-primary hover:underline"
        >
          Resend code
        </button>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/auth/login" className="font-semibold text-muted-foreground hover:underline">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
