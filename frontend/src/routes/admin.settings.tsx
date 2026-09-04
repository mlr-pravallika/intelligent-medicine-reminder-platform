import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  Bell,
  CheckCircle2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";


type AdminSettings = {
  criticalAlerts: boolean;
  systemNotifications: boolean;
  securityNotifications: boolean;
};


const STORAGE_KEY =
  "medicare_admin_settings";


const defaultSettings: AdminSettings =
  {
    criticalAlerts: true,
    systemNotifications: true,
    securityNotifications: true,
  };


export const Route =
  createFileRoute(
    "/admin/settings"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Admin Settings — MediCare AI",
        },
      ],
    }),

    component:
      AdminSettingsPage,
  });


function AdminSettingsPage() {

  const [
    settings,
    setSettings,
  ] =
    useState<AdminSettings>(
      defaultSettings
    );


  useEffect(() => {

    try {

      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (stored) {

        setSettings({
          ...defaultSettings,
          ...JSON.parse(stored),
        });
      }

    } catch {
      // defaults remain active
    }

  }, []);


  const toggle = (
    key: keyof AdminSettings
  ) => {

    setSettings(
      (current) => ({
        ...current,
        [key]:
          !current[key],
      })
    );
  };


  const save =
    () => {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          settings
        )
      );

      toast.success(
        "Admin settings saved."
      );
    };


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Account Settings"
        description="Manage administrator notification and security preferences."
      />


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <SlidersHorizontal className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Administration preferences
            </h2>

            <p className="text-xs text-muted-foreground">
              Choose which platform updates should be surfaced to you.
            </p>

          </div>

        </div>


        <div className="mt-6 space-y-3">

          <Setting
            icon={
              <Bell className="size-4" />
            }
            title="Critical alerts"
            description="Receive important platform alerts."
            enabled={
              settings.criticalAlerts
            }
            onToggle={() =>
              toggle(
                "criticalAlerts"
              )
            }
          />


          <Setting
            icon={
              <Bell className="size-4" />
            }
            title="System notifications"
            description="Receive service and system updates."
            enabled={
              settings.systemNotifications
            }
            onToggle={() =>
              toggle(
                "systemNotifications"
              )
            }
          />


          <Setting
            icon={
              <ShieldCheck className="size-4" />
            }
            title="Security notifications"
            description="Receive security-related notifications."
            enabled={
              settings.securityNotifications
            }
            onToggle={() =>
              toggle(
                "securityNotifications"
              )
            }
          />

        </div>

      </Card>


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
              MediCare AI is currently configured for dark mode.
            </p>

          </div>

        </div>


        <div className="mt-5 flex items-center justify-between rounded-xl border border-border/70 p-4">

          <div>

            <p className="text-sm font-semibold">
              Dark mode
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Active across your administration workspace.
            </p>

          </div>


          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500">

            <CheckCircle2 className="size-3.5" />

            Enabled

          </span>

        </div>

      </Card>


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <LockKeyhole className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Security
            </h2>

            <p className="text-xs text-muted-foreground">
              Use the verified email password recovery process.
            </p>

          </div>

        </div>


        <Button
          asChild
          variant="outline"
          className="mt-5 rounded-xl"
        >
          <Link to="/auth/forgot-password">
            Reset password
          </Link>
        </Button>

      </Card>


      <div className="flex justify-end">

        <Button
          onClick={save}
          className="bg-brand-gradient rounded-xl px-6"
        >
          Save settings
        </Button>

      </div>

    </div>
  );
}


function Setting({
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