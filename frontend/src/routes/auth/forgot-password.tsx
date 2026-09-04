import { useState } from "react";
import { AxiosError } from "axios";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
} from "lucide-react";

import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "@/services/authService";


export const Route =
  createFileRoute(
    "/auth/forgot-password"
  )({
    head: () => ({
      meta: [
        {
          title: "Forgot Password — MediCare AI",
        },
      ],
    }),

    component:
      ForgotPasswordPage,
  });


type Step =
  | "email"
  | "code"
  | "password"
  | "success";


function ForgotPasswordPage() {

  const navigate =
    useNavigate();

  const [step, setStep] =
    useState<Step>("email");

  const [email, setEmail] =
    useState("");

  const [code, setCode] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleEmailSubmit = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    if (!email.trim()) {

      toast.error(
        "Please enter your email."
      );

      return;
    }

    try {

      setLoading(true);

      await forgotPassword(
        email.trim()
      );

      toast.success(
        "If this email is registered, a verification code has been sent."
      );

      setStep("code");

    } catch (error) {

      const err =
        error as AxiosError<{
          detail?: string;
        }>;

      toast.error(
        err.response?.data?.detail ||
          "Unable to process request."
      );

    } finally {

      setLoading(false);

    }
  };


  const handleCodeSubmit = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    if (
      !/^\d{6}$/.test(code)
    ) {

      toast.error(
        "Enter the 6-digit verification code."
      );

      return;
    }

    try {

      setLoading(true);

      await verifyResetCode(
        email.trim(),
        code
      );

      toast.success(
        "Verification successful."
      );

      setStep("password");

    } catch (error) {

      const err =
        error as AxiosError<{
          detail?: string;
        }>;

      toast.error(
        err.response?.data?.detail ||
          "Invalid verification code."
      );

    } finally {

      setLoading(false);

    }
  };


  const handlePasswordSubmit =
    async (
      event: React.FormEvent
    ) => {

      event.preventDefault();

      if (
        newPassword.length < 8
      ) {

        toast.error(
          "Password must contain at least 8 characters."
        );

        return;
      }

      if (!/[A-Z]/.test(newPassword)) {

        toast.error(
          "Password needs an uppercase letter."
        );

        return;
      }

      if (!/[a-z]/.test(newPassword)) {

        toast.error(
          "Password needs a lowercase letter."
        );

        return;
      }

      if (!/\d/.test(newPassword)) {

        toast.error(
          "Password needs a number."
        );

        return;
      }

      if (!/[^\w\s]/.test(newPassword)) {

        toast.error(
          "Password needs a special character."
        );

        return;
      }

      if (
        newPassword !== confirmPassword
      ) {

        toast.error(
          "Passwords do not match."
        );

        return;
      }

      try {

        setLoading(true);

        await resetPassword(
          email.trim(),
          code,
          newPassword
        );

        setStep("success");

        toast.success(
          "Password reset successfully."
        );

      } catch (error) {

        const err =
          error as AxiosError<{
            detail?: string;
          }>;

        toast.error(
          err.response?.data?.detail ||
            "Unable to reset password."
        );

      } finally {

        setLoading(false);

      }
    };


  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">

      {step === "email" && (
        <>
          <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <Mail className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold">
            Forgot password?
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Enter your registered email address and we will
            send you a verification code.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={
              handleEmailSubmit
            }
          >

            <div className="space-y-2">

              <Label htmlFor="forgot-email">
                Email address
              </Label>

              <Input
                id="forgot-email"
                type="email"
                required
                autoComplete="off"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="h-11 rounded-xl"
              />

            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-gradient h-11 w-full rounded-xl"
            >
              {loading
                ? "Sending..."
                : "Send verification code"}
            </Button>

          </form>
        </>
      )}


      {step === "code" && (
        <>
          <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <KeyRound className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold">
            Verify your email
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code sent to:
          </p>

          <p className="mt-1 font-semibold">
            {email}
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={
              handleCodeSubmit
            }
          >

            <div className="space-y-2">

              <Label htmlFor="verification-code">
                Verification code
              </Label>

              <Input
                id="verification-code"
                inputMode="numeric"
                maxLength={6}
                required
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                className="h-12 text-center text-lg font-bold tracking-[0.4em]"
              />

            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-gradient h-11 w-full rounded-xl"
            >
              {loading
                ? "Verifying..."
                : "Verify code"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() =>
                setStep("email")
              }
            >
              Change email
            </Button>

          </form>
        </>
      )}


      {step === "password" && (
        <>
          <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <KeyRound className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold">
            Create a new password
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong new password for your account.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={
              handlePasswordSubmit
            }
          >

            <div className="space-y-2">

              <Label htmlFor="new-password">
                New password
              </Label>

              <Input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Create a new password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                className="h-11 rounded-xl"
              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="confirm-new-password">
                Confirm password
              </Label>

              <Input
                id="confirm-new-password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                className="h-11 rounded-xl"
              />

            </div>

            <p className="text-xs text-muted-foreground">
              At least 8 characters with uppercase,
              lowercase, number and special character.
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-gradient h-11 w-full rounded-xl"
            >
              {loading
                ? "Updating..."
                : "Reset password"}
            </Button>

          </form>
        </>
      )}


      {step === "success" && (
        <div className="text-center">

          <div className="mx-auto grid size-14 place-items-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="size-7" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold">
            Password reset successful
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been updated successfully.
            Please sign in with your new password.
          </p>

          <Button
            className="mt-6 w-full rounded-xl"
            onClick={() =>
              navigate({
                to: "/auth/login",
              })
            }
          >
            Go to login
          </Button>

        </div>
      )}


      {step !== "success" && (
        <div className="mt-6">

          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>

        </div>
      )}

    </Card>
  );
}