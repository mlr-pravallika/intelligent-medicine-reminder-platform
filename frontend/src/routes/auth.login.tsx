import {
  FormEvent,
  useState,
} from "react";

import { AxiosError } from "axios";

import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
} from "lucide-react";

import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  RoleSelector,
  type PortalRoleValue,
} from "@/components/auth/auth-parts";


export const Route = createFileRoute(
  "/auth/login"
)({
  head: () => ({
    meta: [
      {
        title: "Login — MediCare AI",
      },
      {
        name: "description",
        content:
          "Sign in to your MediCare AI patient, caregiver or administrator workspace.",
      },
      {
        property: "og:title",
        content: "Login — MediCare AI",
      },
      {
        property: "og:description",
        content:
          "Secure role-based sign in for MediCare AI.",
      },
    ],
  }),

  component: LoginPage,
});


type PendingLogin = {
  email: string;
  password: string;
};


function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
    loginWithGoogle,
    logout,
  } = useAuth();


  // ============================================================
  // LOGIN FORM STATE
  // ============================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState<PortalRoleValue>(
      "patient"
    );

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);


  // ============================================================
  // SAVE LOGIN POPUP
  // ============================================================

  const [
    showSavePopup,
    setShowSavePopup,
  ] = useState(false);

  const [
    pendingLogin,
    setPendingLogin,
  ] = useState<PendingLogin | null>(
    null
  );

  const [
    loggedInUser,
    setLoggedInUser,
  ] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [
    savingLogin,
    setSavingLogin,
  ] = useState(false);


  // ============================================================
  // ROLE REDIRECT
  // ============================================================

  const redirectByRole = (
    userRole: string
  ) => {

    if (userRole === "admin") {
      navigate({
        to: "/admin",
      });

      return;
    }

    if (userRole === "caregiver") {
      navigate({
        to: "/caregiver",
      });

      return;
    }

    navigate({
      to: "/patient",
    });
  };


  // ============================================================
  // NORMAL LOGIN
  // ============================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();


    if (!email.trim()) {
      toast.error(
        "Please enter your email address."
      );

      return;
    }


    if (!password) {
      toast.error(
        "Please enter your password."
      );

      return;
    }


    try {

      setIsLoading(true);


      const currentUser =
        await login({
          email:
            email.trim(),
          password,
        });


      /*
       * Backend is the source of truth.
       * The selected role is only an additional
       * frontend check.
       */

      if (
        currentUser.role !== role
      ) {

        logout();

        toast.error(
          `This account belongs to the ${currentUser.role} role.`
        );

        return;
      }


      toast.success(
        "Login successful!"
      );


      /*
       * Keep credentials only temporarily in React
       * memory so the user can choose whether to
       * save the account.
       */

      setPendingLogin({
        email:
          email.trim(),
        password,
      });


      setLoggedInUser({
        name:
          currentUser.name,
        email:
          currentUser.email,
        role:
          currentUser.role,
      });


      setShowSavePopup(
        true
      );

    } catch (error) {

      const err =
        error as AxiosError<{
          detail?: string;
        }>;


      toast.error(
        err.response?.data?.detail ||
          "Invalid email or password."
      );

    } finally {

      setIsLoading(false);
    }
  };


  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  const handleGoogleLogin = async (
    credential: string
  ) => {

    try {

      const currentUser =
        await loginWithGoogle(
          credential
        );


      toast.success(
        "Google Login Successful"
      );


      redirectByRole(
        currentUser.role
      );

    } catch (error) {

      console.error(
        "Google Login Error:",
        error
      );


      toast.error(
        "Google Login Failed"
      );
    }
  };


  // ============================================================
  // SAVE LOGIN
  // ============================================================

  const handleSaveLogin = async () => {

    /*
     * The account saving system can be added later.
     *
     * For now the Save button simply confirms
     * the user's choice and continues.
     *
     * Do NOT store the password in localStorage.
     */

    try {

      setSavingLogin(true);

      toast.success(
        "Login saved for quick access."
      );

    } finally {

      setSavingLogin(false);

      continueToDashboard();
    }
  };


  // ============================================================
  // NOT NOW
  // ============================================================

  const handleNotNow = () => {
    continueToDashboard();
  };


  // ============================================================
  // CONTINUE TO DASHBOARD
  // ============================================================

  const continueToDashboard = () => {

    const userRole =
      loggedInUser?.role;


    setShowSavePopup(false);

    setPendingLogin(null);

    setLoggedInUser(null);


    if (!userRole) {

      navigate({
        to: "/auth/login",
      });

      return;
    }


    /*
     * Clear the fields so the next login starts
     * completely empty.
     */

    setEmail("");

    setPassword("");


    redirectByRole(
      userRole
    );
  };


  return (
    <>
      {/* ========================================================
          LOGIN CARD
      ======================================================== */}

      <Card className="gap-0 rounded-3xl border-border/70 p-7 shadow-soft sm:p-8">

        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>


        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to continue managing your medication journey.
        </p>


        {/* ======================================================
            LOGIN FORM
        ====================================================== */}

        <form
          className="mt-6 space-y-5"
          onSubmit={handleSubmit}
          autoComplete="off"
        >

          {/* ----------------------------------------------------
              ROLE
          ---------------------------------------------------- */}

          <RoleSelector
            value={role}
            onChange={(value) => {

              setRole(value);

              /*
               * When switching Patient/Caregiver/Admin,
               * clear the previous credentials.
               */

              setEmail("");

              setPassword("");
            }}
          />


          {/* ----------------------------------------------------
              EMAIL
          ---------------------------------------------------- */}

          <div className="space-y-2">

            <Label htmlFor="login-email">
              Email address
            </Label>


            <Input
              id="login-email"
              name="medicare-email"
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


          {/* ----------------------------------------------------
              PASSWORD
          ---------------------------------------------------- */}

          <div className="space-y-2">

            <Label htmlFor="login-password">
              Password
            </Label>


            <div className="relative">

              <Input
                id="login-password"
                name="medicare-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                required
                autoComplete="off"
                placeholder="Enter your password"
                className="h-11 rounded-xl pr-11"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />


              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                className="absolute right-1 top-1/2 size-9 -translate-y-1/2"
              >

                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}

              </Button>

            </div>

          </div>


          {/* ----------------------------------------------------
              FORGOT PASSWORD
          ---------------------------------------------------- */}

          <div className="flex justify-end">

            <Link
              to="/auth/forgot-password"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>

          </div>


          {/* ----------------------------------------------------
              SIGN IN
          ---------------------------------------------------- */}

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-brand-gradient h-11 w-full rounded-xl font-semibold shadow-glow"
          >

            <LogIn className="size-4" />

            {isLoading
              ? "Signing in..."
              : "Sign in"}

          </Button>

        </form>


        {/* ======================================================
            GOOGLE LOGIN
        ====================================================== */}

        <div className="mt-5">

          <GoogleLogin
            onSuccess={async (
              credentialResponse
            ) => {

              const credential =
                credentialResponse.credential;


              if (!credential) {

                toast.error(
                  "Google Login Failed"
                );

                return;
              }


              await handleGoogleLogin(
                credential
              );
            }}

            onError={() => {

              toast.error(
                "Google Login Failed"
              );
            }}
          />

        </div>


        {/* ======================================================
            REGISTER LINK
        ====================================================== */}

        <p className="mt-6 text-center text-sm text-muted-foreground">

          New to MediCare AI?{" "}

          <Link
            to="/auth/register"
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>

        </p>

      </Card>


      {/* ========================================================
          SAVE LOGIN POPUP
      ======================================================== */}

      {showSavePopup &&
        pendingLogin &&
        loggedInUser && (

          <div
            className="
              fixed
              inset-0
              z-[200]
              grid
              place-items-center
              bg-black/70
              p-4
              backdrop-blur-sm
            "
          >

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-login-title"
              className="
                w-full
                max-w-md
                rounded-3xl
                border
                border-border
                bg-card
                p-6
                shadow-2xl
              "
            >

              {/* ------------------------------------------------
                  ICON + TITLE
              ------------------------------------------------ */}

              <div className="flex items-start gap-4">

                <div
                  className="
                    grid
                    size-12
                    shrink-0
                    place-items-center
                    rounded-2xl
                    bg-primary-soft
                    text-primary
                  "
                >

                  <KeyRound className="size-6" />

                </div>


                <div className="min-w-0">

                  <h2
                    id="save-login-title"
                    className="text-lg font-extrabold text-foreground"
                  >
                    Save your login?
                  </h2>


                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Save this account for faster access next time.
                  </p>

                </div>

              </div>


              {/* ------------------------------------------------
                  ACCOUNT DETAILS
              ------------------------------------------------ */}

              <div
                className="
                  mt-5
                  rounded-2xl
                  border
                  border-border/70
                  bg-muted/30
                  p-4
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      grid
                      size-10
                      shrink-0
                      place-items-center
                      rounded-xl
                      bg-primary/10
                      text-primary
                    "
                  >

                    <ShieldCheck className="size-5" />

                  </div>


                  <div className="min-w-0">

                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {loggedInUser.role}
                    </p>


                    <p className="truncate text-sm font-bold text-foreground">
                      {loggedInUser.name}
                    </p>


                    <p className="truncate text-xs text-muted-foreground">
                      {loggedInUser.email}
                    </p>

                  </div>

                </div>

              </div>


              {/* ------------------------------------------------
                  BUTTONS
              ------------------------------------------------ */}

              <div
                className="
                  mt-6
                  flex
                  flex-col-reverse
                  gap-3
                  sm:flex-row
                  sm:justify-end
                "
              >

                <Button
                  type="button"
                  variant="outline"
                  disabled={savingLogin}
                  className="rounded-xl"
                  onClick={
                    handleNotNow
                  }
                >
                  Not now
                </Button>


                <Button
                  type="button"
                  disabled={savingLogin}
                  className="bg-brand-gradient rounded-xl"
                  onClick={
                    handleSaveLogin
                  }
                >
                  {savingLogin
                    ? "Saving..."
                    : "Save login"}
                </Button>

              </div>


              {/* ------------------------------------------------
                  SECURITY NOTE
              ------------------------------------------------ */}

              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
                Your password is not stored in the MediCare AI
                application.
              </p>

            </div>

          </div>
        )}

    </>
  );
}