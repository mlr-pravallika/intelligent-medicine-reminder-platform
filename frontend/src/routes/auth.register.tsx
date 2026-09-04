import { useState } from "react";
import { AxiosError } from "axios";

import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  UserPlus,
} from "lucide-react";

import {
  GoogleLogin,
} from "@react-oauth/google";

import { toast } from "sonner";

import {
  useAuth,
} from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  RoleSelector,
  type PortalRoleValue,
} from "@/components/auth/auth-parts";


export const Route =
  createFileRoute("/auth/register")({
    head: () => ({
      meta: [
        {
          title: "Create Account — MediCare AI",
        },
        {
          name: "description",
          content:
            "Create a MediCare AI account as a patient, caregiver or administrator.",
        },
      ],
    }),

    component: RegisterPage,
  });


function RegisterPage() {

  const navigate =
    useNavigate();

  const {
    register,
    loginWithGoogle,
  } = useAuth();


  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [role, setRole] =
    useState<PortalRoleValue>("patient");

  const [loading, setLoading] =
    useState(false);


  const validatePassword = (
    value: string
  ) => {

    if (value.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must contain one uppercase letter.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password must contain one lowercase letter.";
    }

    if (!/\d/.test(value)) {
      return "Password must contain one number.";
    }

    if (!/[^\w\s]/.test(value)) {
      return "Password must contain one special character.";
    }

    return null;
  };


  const handleSubmit = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    const passwordError =
      validatePassword(password);

    if (passwordError) {

      toast.error(
        passwordError
      );

      return;
    }

    if (
      password !== confirmPassword
    ) {

      toast.error(
        "Passwords do not match."
      );

      return;
    }


    try {

      setLoading(true);

      await register({
        name:
          `${firstName.trim()} ${lastName.trim()}`.trim(),

        email:
          email.trim(),

        phone:
          phone.trim(),

        password,

        role,
      });


      toast.success(
        "Account created successfully. Please sign in."
      );


      navigate({
        to: "/auth/login",
      });

    } catch (error) {

      const err =
        error as AxiosError<{
          detail?: string;
        }>;

      toast.error(
        err.response?.data?.detail ||
          "Registration failed."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">

      <h1 className="text-2xl font-extrabold">
        Create your account
      </h1>

      <p className="mt-1.5 text-sm text-muted-foreground">
        Join MediCare AI and take control of your medication journey.
      </p>


      <form
        className="mt-6 space-y-5"
        onSubmit={handleSubmit}
        autoComplete="off"
      >

        <RoleSelector
          value={role}
          onChange={setRole}
        />


        <div className="grid gap-4 sm:grid-cols-2">

          <div className="space-y-2">

            <Label htmlFor="first-name">
              First name
            </Label>

            <Input
              id="first-name"
              name="first-name"
              required
              autoComplete="given-name"
              placeholder="First name"
              className="h-11 rounded-xl"
              value={firstName}
              onChange={(event) =>
                setFirstName(
                  event.target.value
                )
              }
            />

          </div>


          <div className="space-y-2">

            <Label htmlFor="last-name">
              Last name
            </Label>

            <Input
              id="last-name"
              name="last-name"
              required
              autoComplete="family-name"
              placeholder="Last name"
              className="h-11 rounded-xl"
              value={lastName}
              onChange={(event) =>
                setLastName(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        <div className="space-y-2">

          <Label htmlFor="reg-email">
            Email address
          </Label>

          <Input
            id="reg-email"
            name="reg-email"
            type="email"
            required
            autoComplete="off"
            placeholder="you@example.com"
            className="h-11 rounded-xl"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
          />

        </div>


        <div className="space-y-2">

          <Label htmlFor="reg-phone">
            Mobile number
          </Label>

          <Input
            id="reg-phone"
            name="reg-phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+91 9876543210"
            className="h-11 rounded-xl"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
          />

        </div>


        <div className="space-y-2">

          <Label htmlFor="reg-password">
            Password
          </Label>

          <Input
            id="reg-password"
            name="reg-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Create a password"
            className="h-11 rounded-xl"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          <p className="text-xs text-muted-foreground">
            Minimum 8 characters, including uppercase,
            lowercase, number and special character.
          </p>

        </div>


        <div className="space-y-2">

          <Label htmlFor="confirm-password">
            Confirm password
          </Label>

          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
            className="h-11 rounded-xl"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
          />

        </div>


        <div className="flex items-start gap-2">

          <Checkbox
            id="terms"
            required
            className="mt-0.5"
          />

          <Label
            htmlFor="terms"
            className="text-sm font-normal leading-relaxed text-muted-foreground"
          >
            I agree to the Terms and Privacy Policy.
          </Label>

        </div>


        <Button
          type="submit"
          disabled={loading}
          className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow"
        >
          <UserPlus className="size-4" />

          {loading
            ? "Creating..."
            : "Create account"}

        </Button>

      </form>


      <div className="mt-5">

        <GoogleLogin
          onSuccess={async (
            credentialResponse
          ) => {

            const credential =
              credentialResponse.credential;

            if (!credential) {

              toast.error(
                "Google registration failed."
              );

              return;
            }

            try {

              const currentUser =
                await loginWithGoogle(
                  credential
                );

              toast.success(
                "Google registration successful."
              );

              if (
                currentUser.role === "admin"
              ) {

                navigate({
                  to: "/admin",
                });

              } else if (
                currentUser.role === "caregiver"
              ) {

                navigate({
                  to: "/caregiver",
                });

              } else {

                navigate({
                  to: "/patient",
                });

              }

            } catch (error) {

              console.error(error);

              toast.error(
                "Google registration failed."
              );

            }

          }}

          onError={() => {

            toast.error(
              "Google registration failed."
            );

          }}
        />

      </div>


      <p className="mt-6 text-center text-sm text-muted-foreground">

        Already registered?{" "}

        <Link
          to="/auth/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>

      </p>

    </Card>
  );
}