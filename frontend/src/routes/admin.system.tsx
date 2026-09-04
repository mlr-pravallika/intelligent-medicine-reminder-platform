import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Card,
} from "@/components/ui/card";


type SystemStatus = {
  api: string;
  database: string;
  scheduler: string;
  checked_at: string;
};


export const Route =
  createFileRoute(
    "/admin/system"
  )({
    head: () => ({
      meta: [
        {
          title:
            "System Monitoring — MediCare AI",
        },
      ],
    }),

    component:
      AdminSystem,
  });


function AdminSystem() {

  const [
    status,
    setStatus,
  ] = useState<SystemStatus | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);


  const loadStatus =
    async () => {

      try {

        setLoading(true);

        const response =
          await api.get<SystemStatus>(
            "/admin/system"
          );

        setStatus(
          response.data
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    loadStatus();
  }, []);


  return (
    <div className="space-y-6">

      <SectionHeading
        title="System Monitoring"
        description="Live health status of the MediCare AI backend and database."
      />


      {loading || !status ? (

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            Checking system health...

          </div>

        </Card>

      ) : (

        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <SystemCard
              icon={
                <Server className="size-5" />
              }
              title="API"
              value={
                status.api
              }
            />


            <SystemCard
              icon={
                <Database className="size-5" />
              }
              title="Database"
              value={
                status.database
              }
            />


            <SystemCard
              icon={
                <Timer className="size-5" />
              }
              title="Scheduler"
              value={
                status.scheduler
              }
            />


            <SystemCard
              icon={
                <ShieldCheck className="size-5" />
              }
              title="Security"
              value="active"
            />

          </div>


          <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Service health"
              description="Latest status returned by the Admin API."
            />


            <div className="mt-5 space-y-3">

              <HealthRow
                label="FastAPI API"
                status={status.api}
              />

              <HealthRow
                label="PostgreSQL"
                status={status.database}
              />

              <HealthRow
                label="Reminder scheduler"
                status={status.scheduler}
              />

            </div>


            <p className="mt-5 text-xs text-muted-foreground">

              Last checked:{" "}
              {new Date(
                status.checked_at
              ).toLocaleString(
                "en-IN"
              )}

            </p>

          </Card>
        </>

      )}

    </div>
  );
}


function SystemCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {

  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-soft">

      <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="mt-2 flex items-center gap-2">

        <span className="text-lg font-bold capitalize">
          {value}
        </span>

        <CheckCircle2 className="size-4 text-emerald-500" />

      </div>

    </Card>
  );
}


function HealthRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">

      <span className="text-sm font-semibold">
        {label}
      </span>

      <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold capitalize text-emerald-500">

        <CheckCircle2 className="size-3.5" />

        {status}

      </span>

    </div>
  );
}