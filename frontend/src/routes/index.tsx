import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  FileScan,
  HeartPulse,
  Package,
  Pill,
  ShieldCheck,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero-medicare.jpg";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediCare AI — Smarter Medicine Management Powered by AI" },
      {
        name: "description",
        content:
          "AI-powered medicine reminders, OCR prescription scanning, refill prediction, caregiver monitoring and healthcare analytics in one secure platform.",
      },
      { property: "og:title", content: "MediCare AI — Smarter Medicine Management Powered by AI" },
      {
        property: "og:description",
        content:
          "Never miss a dose. Improve medication adherence with AI reminders, OCR scanning, refill prediction and caregiver monitoring.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Bot, title: "AI Medicine Recognition", body: "Identify medicines from photos and surface dosage, purpose and safety notes instantly." },
  { icon: FileScan, title: "OCR Prescription Upload", body: "Scan a paper prescription and auto-extract medicines, dosage, frequency and duration." },
  { icon: Pill, title: "Medication Tracking", body: "A single source of truth for every active, paused, completed and expired medicine." },
  { icon: Bell, title: "Medicine Reminders", body: "Multi-channel push, SMS and email reminders with snooze, skip and escalation rules." },
  { icon: BarChart3, title: "Medication Analytics", body: "Adherence, reminder success and consumption trends across day, week, month and year." },
  { icon: Package, title: "Refill Prediction", body: "Forecast run-out dates from real consumption and trigger low-stock warnings early." },
  { icon: Users, title: "Caregiver Monitoring", body: "Live medicine status, missed-dose alerts and shared reports for family and clinicians." },
  { icon: ShieldCheck, title: "Secure Authentication", body: "Role-based access for patients, caregivers and administrators with verified sessions." },
];

const previews = [
  {
    title: "Patient Dashboard",
    body: "Today's doses, reminder timeline, adherence score and AI health insights.",
    to: "/patient",
    stats: [
      "Medicine Dashboard",
      "Reminder Center",
      "Analytics"
    ],
  },
  {
    title: "Caregiver Dashboard",
    body: "Assigned patients, live medicine status, critical alerts and adherence reports.",
    to: "/caregiver",
    stats: [
      "Patient Monitoring",
      "Medicine Tracking",
      "Emergency Alerts"
    ],
  },
  {
    title: "Admin Dashboard",
    body: "User management, platform analytics, OCR statistics and system monitoring.",
    to: "/admin",
    stats: [
      "User Management",
      "Platform Analytics",
      "System Settings"
    ],
  },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden font-semibold sm:inline-flex">
              <Link to="/auth/login">Login</Link>
            </Button>
            <Button asChild className="bg-brand-gradient rounded-full font-semibold shadow-glow">
              <Link to="/auth/register">
                Get Started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-hero-gradient relative overflow-hidden">
          <div className="grid-faint absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary">
                <HeartPulse className="size-3.5" aria-hidden="true" />
                AI Powered Medicine Reminder Platform
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Smarter Medicine Management{" "}
                <span className="text-brand-gradient">Powered by AI</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                An intelligent medicine reminder platform that helps patients manage medications using AI-powered prescription scanning, smart reminders, refill prediction, caregiver monitoring and a virtual medical assistant.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild className="bg-brand-gradient rounded-full px-7 font-semibold shadow-glow">
                  <Link to="/auth/register">
                    Get Started <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full border-border bg-card px-7 font-semibold">
                  <Link to="/auth/login">Login</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="glass-panel rounded-[2rem] p-3 shadow-elevated">
                <img
                  src={heroImage}
                  alt="Illustration of a medication dashboard with a daily dose timeline and pill capsules"
                  width={1200}
                  height={960}
                  className="w-full rounded-[1.6rem]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Key Features
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to manage medicines safely and efficiently.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <li key={f.title}>
                <Card className="h-full gap-0 rounded-2xl border-border/70 p-6 shadow-soft transition-transform duration-200 hover:-translate-y-1">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <f.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-border bg-muted/40 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Platform Modules
              </h2>
              <p className="mt-3 text-muted-foreground">
                Dedicated dashboards for Patients, Caregivers and Administrators.
              </p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {previews.map((p) => (
                <Card key={p.title} className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
                  <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                  <ul className="mt-5 space-y-2">
                    {p.stats.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="size-4 text-accent" aria-hidden="true" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6 w-full rounded-full font-semibold">
                    <Link to={p.to}>
                      Preview <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <Logo />
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              MediCare AI is an AI-powered medicine reminder platform designed to improve medication adherence and healthcare management.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              About
            </Link>
            <Link to="/" className="hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © 2026 MediCare AI | Developed by Marri Lalitha Raga Pravallika
        </div>
      </footer>
    </div>
  );
}
