import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  Activity,
  CheckCircle2,
  Pill,
  RefreshCw,
  Users,
  XCircle,
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

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Card,
} from "@/components/ui/card";

import {
  Progress,
} from "@/components/ui/progress";


type Analytics = {
  users: {
    total: number;
    patients: number;
    caregivers: number;
  };
  medicines: {
    active: number;
  };
  reminders: {
    taken: number;
    missed: number;
    total: number;
    adherence: number;
  };
};


export const Route =
  createFileRoute(
    "/admin/analytics"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Platform Analytics — MediCare AI",
        },
      ],
    }),

    component:
      AdminAnalytics,
  });


function AdminAnalytics() {

  const [
    analytics,
    setAnalytics,
  ] = useState<Analytics | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {

    const load =
      async () => {

        try {

          const response =
            await api.get<Analytics>(
              "/admin/analytics"
            );

          setAnalytics(
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

          toast.error(
            err.response?.data?.detail ||
              "Unable to load analytics."
          );

        } finally {

          setLoading(false);
        }
      };


    load();

  }, []);


  if (loading || !analytics) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title="Platform Analytics"
          description="Loading real platform analytics..."
        />

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            Loading analytics...

          </div>

        </Card>

      </div>
    );
  }


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Platform Analytics"
        description="Real medication and platform activity calculated from the database."
      />


      <section className="grid gap-4 md:grid-cols-3">

        <MetricCard
          icon={
            <Users className="size-5" />
          }
          title="Total users"
          value={
            analytics.users.total
          }
        />


        <MetricCard
          icon={
            <Pill className="size-5" />
          }
          title="Active medicines"
          value={
            analytics.medicines.active
          }
        />


        <MetricCard
          icon={
            <Activity className="size-5" />
          }
          title="Reminder events"
          value={
            analytics.reminders.total
          }
        />

      </section>


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="Medication adherence"
          description="Taken versus missed reminder events."
        />


        <div className="mt-6">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Overall adherence
              </p>

              <p className="mt-1 text-4xl font-extrabold">
                {analytics.reminders.adherence}%
              </p>

            </div>

          </div>


          <Progress
            value={
              analytics.reminders.adherence
            }
            className="mt-5 h-3"
          />


          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <StatBox
              icon={
                <CheckCircle2 className="size-4" />
              }
              label="Taken"
              value={
                analytics.reminders.taken
              }
              className="text-emerald-500"
            />


            <StatBox
              icon={
                <XCircle className="size-4" />
              }
              label="Missed"
              value={
                analytics.reminders.missed
              }
              className="text-red-500"
            />


            <StatBox
              icon={
                <Activity className="size-4" />
              }
              label="Total"
              value={
                analytics.reminders.total
              }
              className="text-primary"
            />

          </div>

        </div>

      </Card>


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="User distribution"
          description="Current role distribution."
        />


        <div className="mt-5 grid gap-3 sm:grid-cols-3">

          <StatBox
            icon={
              <Users className="size-4" />
            }
            label="Patients"
            value={
              analytics.users.patients
            }
            className="text-primary"
          />


          <StatBox
            icon={
              <Users className="size-4" />
            }
            label="Caregivers"
            value={
              analytics.users.caregivers
            }
            className="text-emerald-500"
          />


          <StatBox
            icon={
              <Users className="size-4" />
            }
            label="All users"
            value={
              analytics.users.total
            }
            className="text-violet-500"
          />

        </div>

      </Card>

    </div>
  );
}


function MetricCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {

  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-soft">

      <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <p className="mt-1 text-3xl font-extrabold">
        {value}
      </p>

    </Card>
  );
}


function StatBox({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className: string;
}) {

  return (
    <div className="rounded-xl bg-muted/40 p-4">

      <div className={`flex items-center gap-2 ${className}`}>

        {icon}

        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>

      </div>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}