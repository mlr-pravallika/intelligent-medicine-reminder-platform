import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  FileScan,
  HeartPulse,
  Mail,
  Package,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero-medicare.jpg";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";


export const Route = createFileRoute(
  "/",
)({
  head: () => ({
    meta: [
      {
        title:
          "MediCare AI - Smarter Medicine Management Powered by AI",
      },
      {
        name: "description",
        content:
          "AI-powered medicine reminders, prescription scanning, refill prediction, caregiver monitoring and medication analytics in one healthcare platform.",
      },
      {
        property: "og:title",
        content:
          "MediCare AI - Smarter Medicine Management Powered by AI",
      },
      {
        property: "og:description",
        content:
          "Manage medicines smarter with AI prescription scanning, reminders, refill prediction, caregiver monitoring and medication analytics.",
      },
    ],
  }),

  component: Landing,
});


const features = [
  {
    icon: Bot,
    title: "AI Medicine Recognition",
    body:
      "Recognize medicine names and provide useful medication information with AI support.",
  },
  {
    icon: FileScan,
    title: "Prescription OCR",
    body:
      "Upload a prescription and extract medicine names, dosage, frequency and duration into the medicine workflow.",
  },
  {
    icon: Pill,
    title: "Medication Tracking",
    body:
      "Keep all active medicines, schedules, quantities, instructions and low-stock thresholds in one place.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    body:
      "Create multiple reminder times for medicines and track taken, missed and skipped doses.",
  },
  {
    icon: BarChart3,
    title: "Medication Analytics",
    body:
      "Understand reminder outcomes, adherence, medicine consumption and medication trends from real data.",
  },
  {
    icon: Package,
    title: "Refill Prediction",
    body:
      "Track remaining quantity and identify medicines that need replenishment before stock runs out.",
  },
  {
    icon: Users,
    title: "Caregiver Monitoring",
    body:
      "Allow caregivers to view assigned patients, medicine status and important medication updates.",
  },
  {
    icon: ShieldCheck,
    title: "Role Based Access",
    body:
      "Separate patient, caregiver and administrator experiences with authenticated access.",
  },
];


const modules = [
  {
    icon: HeartPulse,
    title: "Patient Portal",
    body:
      "Manage medicines, scan prescriptions, receive reminders, review analytics and use the AI medication assistant.",
    points: [
      "Medicine Management",
      "Prescription OCR",
      "Reminder Center",
      "Medication Analytics",
      "AI Assistant",
      "Refill Prediction",
    ],
    to: "/patient",
  },
  {
    icon: Users,
    title: "Caregiver Portal",
    body:
      "Monitor assigned patients, medicine schedules, adherence information and important patient updates.",
    points: [
      "Patient Monitoring",
      "Medicine Status",
      "Reminder Visibility",
      "Caregiver Support",
    ],
    to: "/caregiver",
  },
  {
    icon: ShieldCheck,
    title: "Admin Portal",
    body:
      "Manage users, monitor the platform and oversee the complete medication management environment.",
    points: [
      "User Management",
      "Platform Monitoring",
      "Notifications",
      "Administration",
    ],
    to: "/admin",
  },
];


const navItems = [
  {
    label: "Home",
    href: "#home",
  },
  {
    label: "Features",
    href: "#features",
  },
  {
    label: "Modules",
    href: "#modules",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
  },
  {
    label: "Contact",
    href: "#contact",
  },
];


function Landing() {
  return (
    <div
      id="home"
      className="min-h-dvh scroll-smooth bg-background text-foreground"
    >

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <a
            href="#home"
            aria-label="MediCare AI home"
            className="shrink-0"
          >
            <Logo />
          </a>


          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >

            {navItems.map(
              (item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ),
            )}

          </nav>


          <div className="flex items-center gap-2">

            <Button
              variant="ghost"
              asChild
              className="hidden font-semibold sm:inline-flex"
            >
              <Link to="/auth/login">
                Login
              </Link>
            </Button>

            <Button
              asChild
              className="rounded-full bg-brand-gradient font-semibold shadow-glow"
            >
              <Link to="/auth/register">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>

          </div>

        </div>


        <div className="border-t border-border/50 lg:hidden">

          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6"
          >

            {navItems.map(
              (item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ),
            )}

          </nav>

        </div>

      </header>


      <main>

        <section className="relative overflow-hidden bg-hero-gradient">

          <div
            className="grid-faint absolute inset-0 opacity-40"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">

            <div className="animate-rise">

              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary">

                <HeartPulse className="size-3.5" />

                AI Powered Medicine Reminder Platform

              </span>


              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">

                Smarter Medicine Management{" "}

                <span className="text-brand-gradient">
                  Powered by AI
                </span>

              </h1>


              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                MediCare AI is an intelligent medication management platform designed to help patients stay on schedule, understand their prescriptions, track medicine quantities, receive reminders and improve medication adherence.
              </p>


              <div className="mt-8 flex flex-wrap gap-3">

                <Button
                  size="lg"
                  asChild
                  className="rounded-full bg-brand-gradient px-7 font-semibold shadow-glow"
                >
                  <Link to="/auth/register">
                    Get Started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full border-border bg-card px-7 font-semibold"
                >
                  <a href="#features">
                    Explore Features
                  </a>
                </Button>

              </div>


              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">

                {[
                  "AI OCR",
                  "Smart Reminders",
                  "Refill Tracking",
                  "Caregiver Support",
                ].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-border/70 bg-card/70 px-3 py-3 text-center text-xs font-semibold text-foreground shadow-soft"
                    >
                      {item}
                    </div>
                  ),
                )}

              </div>

            </div>


            <div className="relative">

              <div className="glass-panel rounded-[2rem] p-3 shadow-elevated">

                <img
                  src={heroImage}
                  alt="MediCare AI medication dashboard"
                  width={1200}
                  height={960}
                  className="w-full rounded-[1.6rem]"
                />

              </div>


              <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-elevated sm:block">

                <div className="flex items-center gap-3">

                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <CheckCircle2 className="size-5" />
                  </span>

                  <div>
                    <p className="text-sm font-bold">
                      Medication support
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reminders and tracking in one platform
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        <section
          id="features"
          className="scroll-mt-32 px-4 py-16 sm:px-6 lg:py-20"
        >

          <div className="mx-auto max-w-7xl">

            <div className="max-w-3xl">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                Features
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Everything needed for smarter medication management
              </h2>

              <p className="mt-3 text-muted-foreground">
                Your current project combines AI support, prescription scanning, medicine tracking, reminders, analytics, refill monitoring and role-based healthcare dashboards.
              </p>

            </div>


            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {features.map(
                (feature) => (
                  <li key={feature.title}>

                    <Card className="h-full gap-0 rounded-2xl border-border/70 p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-elevated">

                      <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                        <feature.icon className="size-5" />
                      </span>

                      <h3 className="mt-4 text-base font-bold">
                        {feature.title}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.body}
                      </p>

                    </Card>

                  </li>
                ),
              )}

            </ul>

          </div>

        </section>


        <section
          id="modules"
          className="scroll-mt-32 border-y border-border bg-muted/40 py-16 lg:py-20"
        >

          <div className="mx-auto max-w-7xl px-4 sm:px-6">

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Platform Modules
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              One healthcare platform, three connected portals
            </h2>

            <p className="mt-3 max-w-2xl text-muted-foreground">
              Patient, caregiver and administrator experiences are connected so medication information can move through the complete care workflow.
            </p>


            <div className="mt-10 grid gap-5 lg:grid-cols-3">

              {modules.map(
                (module) => (
                  <Card
                    key={module.title}
                    className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft"
                  >

                    <div className="flex items-center gap-3">

                      <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                        <module.icon className="size-5" />
                      </span>

                      <h3 className="text-lg font-bold">
                        {module.title}
                      </h3>

                    </div>


                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {module.body}
                    </p>


                    <ul className="mt-5 space-y-2">

                      {module.points.map(
                        (point) => (
                          <li
                            key={point}
                            className="flex items-center gap-2 text-sm font-medium"
                          >
                            <CheckCircle2 className="size-4 text-accent" />
                            {point}
                          </li>
                        ),
                      )}

                    </ul>


                    <Button
                      asChild
                      variant="outline"
                      className="mt-6 w-full rounded-full font-semibold"
                    >
                      <Link to={module.to}>
                        Open Module
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>

                  </Card>
                ),
              )}

            </div>

          </div>

        </section>


        <section
          id="how-it-works"
          className="scroll-mt-32 px-4 py-16 sm:px-6 lg:py-20"
        >

          <div className="mx-auto max-w-7xl">

            <div className="max-w-3xl">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                How It Works
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                From prescription to daily medication support
              </h2>

              <p className="mt-3 text-muted-foreground">
                MediCare AI brings the major workflows of your project together in a clear patient journey.
              </p>

            </div>


            <div className="mt-10 grid gap-5 md:grid-cols-4">

              {[
                {
                  number: "01",
                  title: "Scan",
                  body:
                    "Upload a prescription image and extract medicine information.",
                  icon: FileScan,
                },
                {
                  number: "02",
                  title: "Configure",
                  body:
                    "Review dosage, schedule, dates, quantities and low-stock alerts.",
                  icon: Pill,
                },
                {
                  number: "03",
                  title: "Remind",
                  body:
                    "Receive medication reminders and record taken, missed or skipped doses.",
                  icon: Bell,
                },
                {
                  number: "04",
                  title: "Improve",
                  body:
                    "Use analytics, refill tracking, caregivers and the AI assistant to manage medication better.",
                  icon: BarChart3,
                },
              ].map(
                (step) => (
                  <Card
                    key={step.number}
                    className="relative gap-0 rounded-2xl border-border/70 p-6 shadow-soft"
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-bold tracking-[0.2em] text-primary">
                        {step.number}
                      </span>

                      <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                        <step.icon className="size-5" />
                      </span>

                    </div>

                    <h3 className="mt-6 text-lg font-bold">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>

                  </Card>
                ),
              )}

            </div>

          </div>

        </section>


        <section
          id="contact"
          className="scroll-mt-32 border-t border-border bg-muted/40 py-16 lg:py-20"
        >

          <div className="mx-auto max-w-7xl px-4 sm:px-6">

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                  Contact
                </p>

                <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Built as a complete AI healthcare management project
                </h2>

                <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                  MediCare AI brings together medication management, prescription OCR, smart reminders, refill tracking, caregiver support, analytics and an AI medication assistant in one platform.
                </p>


                <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">

                  <div className="flex items-start gap-4">

                    <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Stethoscope className="size-5" />
                    </span>

                    <div>

                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        Project Developer
                      </p>

                      <h3 className="mt-1 text-xl font-bold">
                        Marri Lalitha Raga Pravallika
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        MediCare AI - AI Powered Medicine Reminder and Medication Management Platform
                      </p>

                    </div>

                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">

                    <div className="rounded-xl border border-border/70 p-4">

                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-primary" />
                        <p className="text-sm font-semibold">
                          Contact
                        </p>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Please use the project team contact details associated with your MediCare AI submission.
                      </p>

                    </div>


                    <div className="rounded-xl border border-border/70 p-4">

                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary" />
                        <p className="text-sm font-semibold">
                          Platform
                        </p>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Patient, Caregiver and Admin portals with secure authenticated access.
                      </p>

                    </div>

                  </div>

                </div>

              </div>


              <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

                <div className="grid size-12 place-items-center rounded-xl bg-brand-gradient text-primary-foreground">
                  <HeartPulse className="size-5" />
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Start with MediCare AI
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Create an account and explore the medication management workflow.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <Button
                    asChild
                    className="rounded-full bg-brand-gradient font-semibold shadow-glow"
                  >
                    <Link to="/auth/register">
                      Get Started
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full font-semibold"
                  >
                    <Link to="/auth/login">
                      Login
                    </Link>
                  </Button>

                </div>

              </Card>

            </div>

          </div>

        </section>

      </main>


      <footer className="border-t border-border bg-background">
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          2026 MediCare AI | Developed by Marri Lalitha Raga Pravallika
        </div>
      </footer>

    </div>
  );
}
