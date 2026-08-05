import { useState } from "react";
import { AxiosError } from "axios";
import { useAuth } from "@/hooks/useAuth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton, RoleSelector, type PortalRoleValue } from "@/components/auth/auth-parts";

import { GoogleLogin } from "@react-oauth/google";

import { getCurrentUser } from "@/services/authService";
import { googleLogin } from "@/services/googleAuthService";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — MediCare AI" },
      { name: "description", content: "Sign in to your MediCare AI patient, caregiver or administrator workspace." },
      { property: "og:title", content: "Login — MediCare AI" },
      { property: "og:description", content: "Secure role-based sign in for MediCare AI." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<PortalRoleValue>("patient");
  const [show, setShow] = useState(false);

  return (
    <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to continue managing your medication journey.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();

          try {
            setIsLoading(true);

            const currentUser = await login({
              email,
              password,
            });

            console.log("Current User:", currentUser);

            toast.success("Login successful!");

            console.log("Logged in user:", currentUser);

            if (currentUser.role === "admin") {
              navigate({ to: "/admin" });
            } else if (currentUser.role === "caregiver") {
              navigate({ to: "/caregiver" });
            } else {
              navigate({ to: "/patient" });
            }  
          } catch (error) {
            const err = error as AxiosError<{ detail?: string }>;

            toast.error(err.response?.data?.detail || "Invalid email or password.");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <RoleSelector value={role} onChange={setRole} />

        <div className="space-y-2">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            required
            placeholder="you@example.com"
            className="h-11 rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={show ? "text" : "password"}
              required
              placeholder="••••••••"
              className="h-11 rounded-xl pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1/2 size-9 -translate-y-1/2"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" defaultChecked />
            <Label htmlFor="remember" className="text-sm font-medium text-muted-foreground">
              Remember me
            </Label>
          </div>
          <Link to="/auth/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled= {isLoading}
          className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow"
        >
          <LogIn className="size-4" /> {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-5">

        <GoogleLogin

          onSuccess={async (credentialResponse) => {

            try {

              const token = credentialResponse.credential;

                if (!token) {

                  toast.error("Google login failed");

                  return;

                }

                const data = await googleLogin(token);

                localStorage.setItem(
                  "access_token",
                  data.access_token
                );

                const currentUser = await getCurrentUser();

                await loginWithGoogle(token);

                console.log(currentUser);

                console.log(currentUser);
              

                toast.success("Google Login Successful");

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

                toast.error("Google Login Failed");

              }

            }}

            onError={() => {

              toast.error("Google Login Failed");

            }}

        />

      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to MediCare AI?{" "}
        <Link to="/auth/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
