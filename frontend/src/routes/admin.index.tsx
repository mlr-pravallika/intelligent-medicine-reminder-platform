import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Pill,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  AxiosError,
} from "axios";

import {
  toast,
} from "sonner";

import {
  useAuth,
} from "@/hooks/useAuth";

import api from "@/services/api";

import {
  SectionHeading,
  StatCard,
} from "@/components/portal/stat-card";

import {
  Card,
} from "@/components/ui/card";

import {
  Button,
} from "@/components/ui/button";


type AdminSummary = {
  total_users: number;
  patients: number;
  caregivers: number;
  admins: number;
  medicines: number;
  active_medicines: number;
  notifications: number;
  unread_notifications: number;
  reminder_events: number;
  taken_reminders: number;
  missed_reminders: number;
  overall_adherence: number;
  caregiver_assignments: number;
};


export const Route =
  createFileRoute(
    "/admin/"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Admin Dashboard — MediCare AI",
        },
        {
          name: "description",
          content:
            "Real-time MediCare AI administration dashboard.",
        },
      ],
    }),

    component:
      AdminDashboard,
  });


function AdminDashboard() {

  const {
    user,
  } = useAuth();


  const [
    summary,
    setSummary,
  ] = useState<AdminSummary | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const loadSummary =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await api.get<AdminSummary>(
            "/admin/summary"
          );

        setSummary(
          response.data
        );

      } catch (error) {

        console.error(
          error
        );

        const err =
          error as AxiosError<{
            detail?: string;
          }>;

        setError(
          err.response?.data?.detail ||
            "Unable to load admin dashboard."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    loadSummary();
  }, []);


  const firstName =
    user?.name
      ?.trim()
      .split(" ")[0] ||
    "Admin";


  if (loading) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title={`Welcome back, ${firstName}!`}
          description="Loading your MediCare AI administration dashboard..."
        />

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            <span className="text-sm text-muted-foreground">
              Loading platform data...
            </span>

          </div>

        </Card>

      </div>
    );
  }


  if (error || !summary) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title={`Welcome back, ${firstName}!`}
          description="Your MediCare AI administration workspace."
        />

        <Card className="p-8">

          <div className="text-center">

            <AlertTriangle className="mx-auto size-9 text-destructive" />

            <p className="mt-3 font-semibold">
              {error ||
                "No dashboard data available."}
            </p>

            <Button
              className="mt-4"
              onClick={loadSummary}
            >
              Try again
            </Button>

          </div>

        </Card>

      </div>
    );
  }


  return (
    <div className="space-y-6">

      {/* ====================================================
          WELCOME
      ==================================================== */}

      <div>

        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Welcome back, {firstName}! 👋
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Here's your MediCare AI platform overview. Monitor
          users, medicines, caregiver assignments, reminders,
          notifications and overall medication activity from
          one place.
        </p>

      </div>


      {/* ====================================================
          PRIMARY METRICS
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Registered Users"
          value={String(
            summary.total_users
          )}
          tone="primary"
          icon={
            <Users className="size-5" />
          }
        />


        <StatCard
          label="Patients"
          value={String(
            summary.patients
          )}
          tone="accent"
          icon={
            <UserRound className="size-5" />
          }
        />


        <StatCard
          label="Caregivers"
          value={String(
            summary.caregivers
          )}
          tone="info"
          icon={
            <UserCheck className="size-5" />
          }
        />


        <StatCard
          label="Active Medicines"
          value={String(
            summary.active_medicines
          )}
          tone="warning"
          icon={
            <Pill className="size-5" />
          }
        />

      </section>


      {/* ====================================================
          SECONDARY METRICS
      ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Reminder Events"
          value={String(
            summary.reminder_events
          )}
          icon={
            <ClipboardList className="size-5" />
          }
        />


        <StatCard
          label="Overall Adherence"
          value={`${summary.overall_adherence}%`}
          icon={
            <Activity className="size-5" />
          }
        />


        <StatCard
          label="Notifications"
          value={String(
            summary.notifications
          )}
          icon={
            <Bell className="size-5" />
          }
        />


        <StatCard
          label="Patient Assignments"
          value={String(
            summary.caregiver_assignments
          )}
          icon={
            <ShieldCheck className="size-5" />
          }
        />

      </section>


      {/* ====================================================
          PLATFORM OVERVIEW + SYSTEM STATUS
      ==================================================== */}

      <div className="grid gap-5 xl:grid-cols-2">


        {/* PLATFORM OVERVIEW */}

        <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Platform overview"
            description="Current data stored in MediCare AI."
          />


          <div className="mt-5 space-y-3">

            <InfoRow
              label="Total medicines"
              value={
                summary.medicines
              }
            />

            <InfoRow
              label="Active medicines"
              value={
                summary.active_medicines
              }
            />

            <InfoRow
              label="Taken reminders"
              value={
                summary.taken_reminders
              }
            />

            <InfoRow
              label="Missed reminders"
              value={
                summary.missed_reminders
              }
            />

            <InfoRow
              label="Unread notifications"
              value={
                summary.unread_notifications
              }
            />

          </div>

        </Card>


        {/* SYSTEM STATUS */}

        <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="System status"
            description="Core services required by the platform."
          />


          <div className="mt-5 space-y-3">

            <StatusRow
              label="FastAPI backend"
              status="Online"
            />

            <StatusRow
              label="PostgreSQL database"
              status="Online"
            />

            <StatusRow
              label="Reminder scheduler"
              status="Running"
            />

            <StatusRow
              label="Authentication"
              status="Active"
            />

          </div>

        </Card>

      </div>


      {/* ====================================================
          ADMIN SHORTCUTS
      ==================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="Administration"
          description="Quick access to the main administration tools."
        />


        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <Shortcut
            icon={
              <Users className="size-5" />
            }
            title="User Management"
            description="View patients, caregivers and admins."
            href="/admin/users"
          />


          <Shortcut
            icon={
              <Activity className="size-5" />
            }
            title="Platform Analytics"
            description="Monitor reminders and adherence."
            href="/admin/analytics"
          />


          <Shortcut
            icon={
              <ShieldCheck className="size-5" />
            }
            title="System Monitoring"
            description="Check API, database and scheduler health."
            href="/admin/system"
          />


          <Shortcut
            icon={
              <Bell className="size-5" />
            }
            title="Activity Logs"
            description="Review recent platform activity."
            href="/admin/audit"
          />

        </div>

      </Card>

    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {

  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">

      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="text-sm font-bold">
        {value}
      </span>

    </div>
  );
}


function StatusRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">

      <div className="flex items-center gap-3">

        <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">

          <CheckCircle2 className="size-4" />

        </span>

        <span className="text-sm font-semibold">
          {label}
        </span>

      </div>


      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
        {status}
      </span>

    </div>
  );
}


function Shortcut({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {

  return (
    <a
      href={href}
      className="rounded-2xl border border-border/70 p-4 transition-colors hover:bg-muted/40"
    >

      <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

    </a>
  );
}