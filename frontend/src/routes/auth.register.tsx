import { useState } from "react";
import { AxiosError } from "axios";
import { useAuth } from "@/hooks/useAuth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

import { googleLogin } from "@/services/googleAuthService";

import { getCurrentUser } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton, RoleSelector, type PortalRoleValue } from "@/components/auth/auth-parts";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create Account — MediCare AI" },
      { name: "description", content: "Create a MediCare AI account as a patient, caregiver or administrator." },
      { property: "og:title", content: "Create Account — MediCare AI" },
      { property: "og:description", content: "Start managing medications with AI reminders and analytics." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<PortalRoleValue>("patient");

  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Join MediCare AI and take control of your medication journey.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();

          try {
            setLoading(true);

            await register({
              name: `${firstName} ${lastName}`,
              email,
              phone,
              password,
              role,
            });

            toast.success("Registration successful!");

            navigate({
              to: "/auth/login",
            });
          } catch (error) {
            const err = error as AxiosError<{ detail?: string }>;

            toast.error(
              err.response?.data?.detail ||
                "Registration failed."
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <RoleSelector value={role} onChange={setRole} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              required
              placeholder="Eleanor"
              className="h-11 rounded-xl"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              required
              placeholder="Whitfield"
              className="h-11 rounded-xl"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">Email address</Label>
          <Input
            id="reg-email"
            type="email"
            required
            placeholder="you@example.com"
            className="h-11 rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-phone">Mobile number</Label>
          <Input
            id="reg-phone"
            type="tel"
            required
            placeholder="+91 9876543210"
            className="h-11 rounded-xl"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            required
            placeholder="••••••••"
            className="h-11 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 8 characters with one number and one symbol.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox id="terms" required className="mt-0.5" />
          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <span className="font-semibold text-primary">
              Terms
            </span>
            and{" "}
            <span className="font-semibold text-primary">
              Privacy Policy
            </span>
            .
          </Label>
        </div>

        <Button type="submit" disabled={loading} className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow">
          <UserPlus className="size-4" />
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>

      <div className="mt-5">

        <GoogleLogin

          onSuccess={async (credentialResponse) => {

            try {

              const token = credentialResponse.credential;

                if (!token) {

                  toast.error("Google Login Failed");

                  return;

               }

                const data = await googleLogin(token);

                  localStorage.setItem(
                    "access_token",
                    data.access_token
                  );

                  const currentUser = await getCurrentUser();

                  toast.success("Google Registration Successful");

                  if (currentUser.role === "admin") {

                    navigate({ to: "/admin" });

                  }

                  else if (currentUser.role === "caregiver") {

                    navigate({ to: "/caregiver" });

                  }

                  else {

                    navigate({ to: "/patient" });

                  }

            }

            catch (error) {

              console.error(error);

              toast.error("Google Registration Failed");

            }

          }}

          onError={() => {

            toast.error("Google Login Failed");

          }}

        />

    </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
