import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  Bell,
  CheckCircle2,
  LockKeyhole,
  Mail,
  MessageSquare,
  Moon,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Label,
} from "@/components/ui/label";


type NotificationSettings = {
  emailReminders: boolean;
  smsReminders: boolean;
  criticalAlerts: boolean;
  patientUpdates: boolean;
};


const SETTINGS_KEY =
  "medicare_caregiver_settings";


const defaultSettings:
  NotificationSettings = {
    emailReminders: true,
    smsReminders: true,
    criticalAlerts: true,
    patientUpdates: true,
  };


export const Route = createFileRoute(
  "/caregiver/settings"
)({
  head: () => ({
    meta: [
      {
        title:
          "Account Settings — MediCare AI",
      },
      {
        name: "description",
        content:
          "Manage caregiver notification and security preferences.",
      },
    ],
  }),

  component:
    CaregiverSettings,
});


function CaregiverSettings() {

  const [
    settings,
    setSettings,
  ] =
    useState<NotificationSettings>(
      defaultSettings
    );


  useEffect(() => {

    try {

      const stored =
        localStorage.getItem(
          SETTINGS_KEY
        );

      if (stored) {

        const parsed =
          JSON.parse(
            stored
          );

        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      }

    } catch {
      // Keep defaults.
    }

  }, []);


  const updateSetting = (
    key: keyof NotificationSettings
  ) => {

    setSettings(
      (current) => ({
        ...current,
        [key]:
          !current[key],
      })
    );
  };


  const saveSettings = () => {

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        settings
      )
    );

    toast.success(
      "Account settings saved."
    );
  };


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Account Settings"
        description="Manage your caregiver notification preferences and account security."
      />


      {/* ======================================================
          NOTIFICATIONS
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <Bell className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Care notifications
            </h2>

            <p className="text-xs text-muted-foreground">
              Choose which caregiver updates you want to receive.
            </p>

          </div>

        </div>


        <div className="mt-6 space-y-3">

          <SettingRow
            icon={
              <Mail className="size-4" />
            }
            title="Email reminders"
            description="Receive important medication reminders by email."
            enabled={
              settings.emailReminders
            }
            onToggle={() =>
              updateSetting(
                "emailReminders"
              )
            }
          />


          <SettingRow
            icon={
              <Smartphone className="size-4" />
            }
            title="SMS reminders"
            description="Receive urgent reminder messages by SMS."
            enabled={
              settings.smsReminders
            }
            onToggle={() =>
              updateSetting(
                "smsReminders"
              )
            }
          />


          <SettingRow
            icon={
              <ShieldCheck className="size-4" />
            }
            title="Critical alerts"
            description="Receive high-priority missed-dose and refill alerts."
            enabled={
              settings.criticalAlerts
            }
            onToggle={() =>
              updateSetting(
                "criticalAlerts"
              )
            }
          />


          <SettingRow
            icon={
              <MessageSquare className="size-4" />
            }
            title="Patient updates"
            description="Receive updates related to assigned patients."
            enabled={
              settings.patientUpdates
            }
            onToggle={() =>
              updateSetting(
                "patientUpdates"
              )
            }
          />

        </div>

      </Card>


      {/* ======================================================
          APPEARANCE
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <Moon className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Appearance
            </h2>

            <p className="text-xs text-muted-foreground">
              Your caregiver portal is configured for dark mode.
            </p>

          </div>

        </div>


        <div className="mt-5 flex items-center justify-between rounded-xl border border-border/70 p-4">

          <div>

            <p className="text-sm font-semibold">
              Dark mode
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Active across the MediCare AI portal.
            </p>

          </div>


          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">

            <CheckCircle2 className="size-3.5" />

            Enabled

          </div>

        </div>

      </Card>


      {/* ======================================================
          SECURITY
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <LockKeyhole className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Account security
            </h2>

            <p className="text-xs text-muted-foreground">
              Manage your password through the secure reset flow.
            </p>

          </div>

        </div>


        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-semibold">
              Change password
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Verify your registered email before creating
              a new password.
            </p>

          </div>


          <Button
            asChild
            variant="outline"
            className="rounded-xl"
          >

            <Link to="/auth/forgot-password">
              Reset password
            </Link>

          </Button>

        </div>


        <div className="mt-4 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">

          Your authentication session is protected by
          the current MediCare AI access token.

        </div>

      </Card>


      {/* ======================================================
          SAVE
      ====================================================== */}

      <div className="flex justify-end">

        <Button
          onClick={
            saveSettings
          }
          className="bg-brand-gradient rounded-xl px-6"
        >
          Save settings
        </Button>

      </div>

    </div>
  );
}


/* ============================================================
   SETTING ROW
============================================================ */

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">

      <div className="flex min-w-0 items-center gap-3">

        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">

          {icon}

        </div>


        <div className="min-w-0">

          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>

        </div>

      </div>


      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled
            ? "bg-primary"
            : "bg-muted"
        }`}
      >

        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}