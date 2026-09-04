import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";


type Patient = {
  id: number;
  name: string;
  email: string;
  adherence: number;
  total_reminders: number;
  taken: number;
  missed: number;
  missed_today: number;
};


type ReminderHistory = {
  id: number;
  medicine_name: string;
  dosage: string;
  reminder_time: string;
  status: string;
  sent_at: string;
};


type PatientReport = {
  patient: Patient;
  total: number;
  taken: number;
  missed: number;
  adherence: number;
  history: ReminderHistory[];
};


export const Route = createFileRoute(
  "/caregiver/reports"
)({
  head: () => ({
    meta: [
      {
        title:
          "Adherence Reports — MediCare AI",
      },
      {
        name: "description",
        content:
          "Patient adherence reports based on real reminder history.",
      },
    ],
  }),

  component: CaregiverReports,
});


function CaregiverReports() {

  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [reports, setReports] =
    useState<
      Record<number, PatientReport>
    >({});

  const [loading, setLoading] =
    useState(true);


  const loadReports = async () => {

    try {

      setLoading(true);


      const response =
        await api.get<Patient[]>(
          "/caregiver/patients"
        );


      const patientList =
        response.data;


      setPatients(
        patientList
      );


      const reportResults =
        await Promise.all(
          patientList.map(
            async (patient) => {

              try {

                const reportResponse =
                  await api.get(
                    `/caregiver/patients/${patient.id}/adherence`
                  );


                const data =
                  reportResponse.data;


                return {
                  patient,
                  total:
                    data.summary.total,
                  taken:
                    data.summary.taken,
                  missed:
                    data.summary.missed,
                  adherence:
                    data.summary.adherence,
                  history:
                    data.history,
                };

              } catch {

                return {
                  patient,
                  total:
                    patient.total_reminders,
                  taken:
                    patient.taken,
                  missed:
                    patient.missed,
                  adherence:
                    patient.adherence,
                  history: [],
                };
              }
            }
          )
        );


      const mapped: Record<
        number,
        PatientReport
      > = {};


      reportResults.forEach(
        (report) => {
          mapped[
            report.patient.id
          ] = report;
        }
      );


      setReports(mapped);

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
          "Unable to load adherence reports."
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {
    loadReports();
  }, []);


  if (loading) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title="Adherence Reports"
          description="Loading patient adherence data..."
        />

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            <span className="text-sm text-muted-foreground">
              Loading reports...
            </span>

          </div>

        </Card>

      </div>
    );
  }


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Adherence Reports"
        description="Medication adherence calculated from actual reminder history."
      />


      {patients.length === 0 ? (

        <Card className="p-10 text-center">

          <Activity className="mx-auto size-9 text-muted-foreground" />

          <h3 className="mt-4 font-bold">
            No patient reports available
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Assign patients and record medicine
            activity to generate reports.
          </p>

        </Card>

      ) : (

        <div className="space-y-5">

          {patients.map(
            (patient) => {

              const report =
                reports[patient.id];


              if (!report) {
                return null;
              }


              return (
                <Card
                  key={patient.id}
                  className="rounded-2xl border-border/70 p-6 shadow-soft"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <h2 className="text-lg font-bold">
                        {patient.name}
                      </h2>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Patient ID: {patient.id}
                      </p>

                    </div>


                    <div className="rounded-xl bg-primary/10 px-4 py-3 text-right">

                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Adherence
                      </p>

                      <p className="mt-1 text-2xl font-extrabold text-primary">
                        {report.adherence}%
                      </p>

                    </div>

                  </div>


                  <div className="mt-5">

                    <Progress
                      value={
                        report.adherence
                      }
                      className="h-3"
                    />

                  </div>


                  <div className="mt-5 grid gap-3 sm:grid-cols-3">

                    <div className="rounded-xl bg-emerald-500/10 p-4">

                      <div className="flex items-center gap-2 text-emerald-500">

                        <CheckCircle2 className="size-4" />

                        <span className="text-xs font-bold uppercase">
                          Taken
                        </span>

                      </div>

                      <p className="mt-2 text-2xl font-bold">
                        {report.taken}
                      </p>

                    </div>


                    <div className="rounded-xl bg-red-500/10 p-4">

                      <div className="flex items-center gap-2 text-red-500">

                        <XCircle className="size-4" />

                        <span className="text-xs font-bold uppercase">
                          Missed
                        </span>

                      </div>

                      <p className="mt-2 text-2xl font-bold">
                        {report.missed}
                      </p>

                    </div>


                    <div className="rounded-xl bg-amber-500/10 p-4">

                      <div className="flex items-center gap-2 text-amber-500">

                        <AlertTriangle className="size-4" />

                        <span className="text-xs font-bold uppercase">
                          Missed Today
                        </span>

                      </div>

                      <p className="mt-2 text-2xl font-bold">
                        {patient.missed_today}
                      </p>

                    </div>

                  </div>


                  <div className="mt-6">

                    <div className="flex items-center justify-between">

                      <h3 className="font-bold">
                        Recent medication activity
                      </h3>

                      <span className="text-xs text-muted-foreground">
                        {report.total} recorded reminders
                      </span>

                    </div>


                    {report.history.length ===
                    0 ? (

                      <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-center">

                        <Clock3 className="mx-auto size-6 text-muted-foreground" />

                        <p className="mt-2 text-sm font-semibold">
                          No reminder history yet
                        </p>

                      </div>

                    ) : (

                      <div className="mt-3 divide-y divide-border rounded-xl border border-border/70">

                        {report.history
                          .slice(0, 10)
                          .map(
                            (item) => {

                              const taken =
                                item.status.toLowerCase() ===
                                "taken";


                              return (
                                <div
                                  key={item.id}
                                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >

                                  <div>

                                    <p className="text-sm font-bold">
                                      {item.medicine_name}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.dosage}
                                      {" · "}
                                      {item.reminder_time}
                                    </p>

                                  </div>


                                  <div className="flex items-center gap-3">

                                    <span
                                      className={
                                        `rounded-full px-3 py-1 text-xs font-bold ${
                                          taken
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "bg-red-500/10 text-red-500"
                                        }`
                                      }
                                    >
                                      {item.status}
                                    </span>


                                    <span className="text-[11px] text-muted-foreground">

                                      {new Date(
                                        item.sent_at
                                      ).toLocaleString(
                                        "en-IN"
                                      )}

                                    </span>

                                  </div>

                                </div>
                              );
                            }
                          )}

                      </div>

                    )}

                  </div>

                </Card>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}