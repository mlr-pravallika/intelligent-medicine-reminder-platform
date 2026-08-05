import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Secure Access — MediCare AI" },
      { name: "description", content: "Sign in or create your MediCare AI account to manage medications securely." },
      { property: "og:title", content: "Secure Access — MediCare AI" },
      { property: "og:description", content: "Role-based, verified access for patients, caregivers and administrators." },
    ],
  }),
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="bg-hero-gradient relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="grid-faint absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground">
            Your intelligent healthcare companion
          </h2>
          <p className="mt-4 text-muted-foreground">
            Track medicines, never miss a reminder, scan prescriptions instantly and stay connected
            with your caregivers.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              [Timer, "AI-optimised reminder scheduling"],
              [Sparkles, "OCR prescription capture with confidence scoring"],
              [ShieldCheck, "Role-based, audited access control"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Timer;
              return (
                <li key={text as string} className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
                  <I className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{text as string}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">© 2026 MediCare AI · HIPAA-aware design</p>
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="font-semibold text-primary hover:underline">
              Back to homepage
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
