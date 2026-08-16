import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


type CaregiverPatient = {
  id: number;
  name: string;
  critical_alerts: number;
};


type CaregiverAlert = {
  id: number | string;
  type: string;
  severity: string;
  title: string;
  message: string;
  created_at?: string | null;
  patient_id?: number;
  patient_name?: string;
};


export const Route = createFileRoute(
  "/caregiver/alerts"
)({
  head: () => ({
    meta: [
      {
        title:
          "Critical Alerts — MediCare AI",
      },
      {
        name: "description",
        content:
          "Real-time medication and adherence alerts for assigned patients.",
      },
    ],
  }),

  component: CaregiverAlerts,
});


function CaregiverAlerts() {

  const [alerts, setAlerts] =
    useState<CaregiverAlert[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  const loadAlerts = async () => {

    try {

      setLoading(true);
      setError(null);


      const patientsResponse =
        await api.get<CaregiverPatient[]>(
          "/caregiver/patients"
        );


      const patients =
        patientsResponse.data;


      const alertResults =
        await Promise.all(
          patients.map(
            async (patient) => {

              try {

                const response =
                  await api.get<
                    CaregiverAlert[]
                  >(
                    `/caregiver/patients/${patient.id}/alerts`
                  );


                return response.data.map(
                  (alert) => ({
                    ...alert,
                    patient_id:
                      patient.id,
                    patient_name:
                      patient.name,
                  })
                );

              } catch {
                return [];
              }
            }
          )
        );


      setAlerts(
        alertResults.flat()
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
          "Unable to load alerts."
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {
    loadAlerts();
  }, []);


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Critical Alerts"
        description="Medication, refill and adherence alerts across your assigned patients."
      />


      {loading ? (

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            <span className="text-sm text-muted-foreground">
              Loading patient alerts...
            </span>

          </div>

        </Card>

      ) : error ? (

        <Card className="p-8">

          <div className="text-center">

            <AlertTriangle className="mx-auto size-9 text-destructive" />

            <p className="mt-3 font-semibold">
              Unable to load alerts
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>

            <Button
              className="mt-4"
              onClick={loadAlerts}
            >
              Try again
            </Button>

          </div>

        </Card>

      ) : alerts.length === 0 ? (

        <Card className="p-10 text-center">

          <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">

            <AlertTriangle className="size-6" />

          </div>

          <h3 className="mt-4 text-lg font-bold">
            No active alerts
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Your assigned patients currently have
            no unresolved medication alerts.
          </p>

        </Card>

      ) : (

        <div className="space-y-3">

          {alerts.map((alert) => (

            <Card
              key={`${alert.patient_id}-${alert.id}`}
              className="rounded-2xl border-border/70 p-5 shadow-soft"
            >

              <div className="flex gap-4">

                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">

                  <AlertTriangle className="size-5" />

                </div>


                <div className="min-w-0 flex-1">

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                    <h3 className="font-bold">
                      {alert.title}
                    </h3>

                    <span className="text-[11px] font-bold uppercase tracking-wide text-destructive">
                      {alert.severity}
                    </span>

                  </div>


                  <p className="mt-1 text-sm font-semibold">
                    {alert.patient_name}
                  </p>


                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.message}
                  </p>


                  {alert.created_at && (

                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">

                      <Clock3 className="size-3.5" />

                      {new Date(
                        alert.created_at
                      ).toLocaleString(
                        "en-IN"
                      )}

                    </p>

                  )}

                </div>

              </div>

            </Card>

          ))}

        </div>

      )}

    </div>
  );
}