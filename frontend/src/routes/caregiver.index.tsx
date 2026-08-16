import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock3,
  HeartPulse,
  Mail,
  Phone,
  Pill,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

import {
  SectionHeading,
  StatCard,
} from "@/components/portal/stat-card";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PatientAlert = {
  id: number | string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
};

type CaregiverPatient = {
  id: number;
  name: string;
  email: string;
  phone: string;

  dob?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  height?: string | null;
  weight?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  address?: string | null;

  assigned_at?: string | null;

  medicine_count: number;
  adherence: number;
  total_reminders: number;
  taken: number;
  missed: number;
  missed_today: number;
  critical_alerts: number;

  alerts: PatientAlert[];
};

type CaregiverSummary = {
  assigned_patients: number;
  average_adherence: number;
  missed_today: number;
  critical_alerts: number;
};

type PatientMedicine = {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  instructions?: string | null;
  remaining_quantity: number;
  tablets_per_day: number;
};

export const Route = createFileRoute("/caregiver/")({
  head: () => ({
    meta: [
      {
        title: "Caregiver Dashboard — MediCare AI",
      },
      {
        name: "description",
        content:
          "Real-time caregiver oversight of assigned patients, medicines, adherence and alerts.",
      },
    ],
  }),

  component: CaregiverDashboard,
});

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAge(dob?: string | null) {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age -= 1;
  }

  return age;
}

function formatAssignedDate(
  value?: string | null
) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function CaregiverDashboard() {
  const { user } = useAuth();

  const [
    patients,
    setPatients,
  ] = useState<CaregiverPatient[]>([]);

  const [
    summary,
    setSummary,
  ] = useState<CaregiverSummary | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    expandedPatient,
    setExpandedPatient,
  ] = useState<number | null>(null);

  const [
    medicines,
    setMedicines,
  ] = useState<
    Record<number, PatientMedicine[]>
  >({});

  const [
    loadingMedicines,
    setLoadingMedicines,
  ] = useState<number | null>(null);

  const firstName =
    user?.name?.trim().split(" ")[0] ||
    "Caregiver";

  const formattedDate =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        patientsResponse,
        summaryResponse,
      ] = await Promise.all([
        api.get<CaregiverPatient[]>(
          "/caregiver/patients"
        ),
        api.get<CaregiverSummary>(
          "/caregiver/summary"
        ),
      ]);

      setPatients(
        patientsResponse.data
      );

      setSummary(
        summaryResponse.data
      );
    } catch (error) {
      console.error(
        "Caregiver dashboard error:",
        error
      );

      const err =
        error as AxiosError<{
          detail?: string;
        }>;

      setError(
        err.response?.data?.detail ||
          "Unable to load caregiver dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadMedicines = async (
    patientId: number
  ) => {
    if (medicines[patientId]) {
      setExpandedPatient(patientId);
      return;
    }

    try {
      setLoadingMedicines(patientId);

      const response =
        await api.get<PatientMedicine[]>(
          `/caregiver/patients/${patientId}/medicines`
        );

      setMedicines((current) => ({
        ...current,
        [patientId]: response.data,
      }));

      setExpandedPatient(patientId);
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to load patient medicines."
      );
    } finally {
      setLoadingMedicines(null);
    }
  };

  const sendReminder = async (
    patientId: number,
    medicineId: number
  ) => {
    try {
      await api.post(
        `/caregiver/patients/${patientId}/medicines/${medicineId}/remind`
      );

      toast.success(
        "Reminder sent to patient."
      );

      await loadDashboard();
    } catch (error) {
      console.error(error);

      const err =
        error as AxiosError<{
          detail?: string;
        }>;

      toast.error(
        err.response?.data?.detail ||
          "Unable to send reminder."
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back, {firstName}! 👋
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Loading your caregiver dashboard...
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Assigned patients"
            value="..."
            tone="primary"
            icon={
              <Users className="size-5" />
            }
          />

          <StatCard
            label="Average adherence"
            value="..."
            tone="accent"
            icon={
              <HeartPulse className="size-5" />
            }
          />

          <StatCard
            label="Missed doses today"
            value="..."
            tone="destructive"
            icon={
              <AlertTriangle className="size-5" />
            }
          />

          <StatCard
            label="Critical alerts"
            value="..."
            tone="warning"
            icon={
              <AlertTriangle className="size-5" />
            }
          />

        </section>

        <Card className="p-8">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="size-5 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading caregiver data...
            </p>
          </div>
        </Card>

      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back, {firstName}! 👋
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your caregiver workspace is ready.
          </p>
        </div>

        <Card className="border-destructive/30 p-8">

          <div className="text-center">

            <AlertTriangle className="mx-auto size-10 text-destructive" />

            <h2 className="mt-4 text-lg font-bold">
              Unable to load caregiver data
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>

            <Button
              className="mt-5"
              onClick={loadDashboard}
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

      {/* ======================================================
          WELCOME
      ====================================================== */}

      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">

        <p className="text-sm font-semibold text-primary">
          👋 Welcome back
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {firstName}, your care workspace is ready.
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Monitor your assigned patients, medication
          adherence, missed doses and important care alerts
          from one place.
        </p>

        <p className="mt-3 text-xs font-medium text-muted-foreground">
          {formattedDate}
          {" · "}
          {patients.length} patient
          {patients.length === 1 ? "" : "s"} currently assigned
          to your care.
        </p>

      </section>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Assigned patients"
          value={String(
            summary?.assigned_patients ??
              patients.length
          )}
          tone="primary"
          icon={
            <Users className="size-5" />
          }
        />

        <StatCard
          label="Average adherence"
          value={`${summary?.average_adherence ?? 0}%`}
          tone="accent"
          icon={
            <HeartPulse className="size-5" />
          }
        />

        <StatCard
          label="Missed doses today"
          value={String(
            summary?.missed_today ?? 0
          )}
          tone="destructive"
          icon={
            <AlertTriangle className="size-5" />
          }
        />

        <StatCard
          label="Critical alerts"
          value={String(
            summary?.critical_alerts ?? 0
          )}
          tone="warning"
          icon={
            <AlertTriangle className="size-5" />
          }
        />

      </section>


      {/* ======================================================
          PATIENTS
      ====================================================== */}

      <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="Assigned patients"
          description="Real patient data from your caregiver assignments."
        />


        {patients.length === 0 ? (

          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">

            <Users className="mx-auto size-10 text-muted-foreground" />

            <h3 className="mt-4 text-lg font-bold">
              No patients assigned
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              An administrator needs to assign a patient
              to your caregiver account.
            </p>

          </div>

        ) : (

          <div className="mt-5 space-y-4">

            {patients.map((patient) => {

              const age =
                getAge(patient.dob);

              const isExpanded =
                expandedPatient ===
                patient.id;

              const patientMedicines =
                medicines[patient.id] ?? [];

              return (
                <div
                  key={patient.id}
                  className="overflow-hidden rounded-2xl border border-border/70"
                >

                  {/* PATIENT HEADER */}

                  <div className="p-5">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex min-w-0 items-center gap-3">

                        <Avatar className="size-12 shrink-0">

                          <AvatarFallback className="bg-primary-soft text-sm font-extrabold text-primary">
                            {getInitials(
                              patient.name
                            )}
                          </AvatarFallback>

                        </Avatar>


                        <div className="min-w-0">

                          <h3 className="truncate text-base font-bold">
                            {patient.name}
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            Patient ID: {patient.id}
                            {age !== null
                              ? ` · ${age} years`
                              : ""}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Assigned{" "}
                            {formatAssignedDate(
                              patient.assigned_at
                            )}
                          </p>

                        </div>

                      </div>


                      {/* CONTACT */}

                      <div className="flex flex-wrap gap-2">

                        {patient.email && (
                          <a
                            href={`mailto:${patient.email}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                          >
                            <Mail className="size-3.5" />
                            Email
                          </a>
                        )}

                        {patient.phone && (
                          <a
                            href={`tel:${patient.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                          >
                            <Phone className="size-3.5" />
                            Call
                          </a>
                        )}

                      </div>

                    </div>


                    {/* PROFILE + ADHERENCE */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                      <InfoCard
                        label="Condition"
                        value={
                          patient.medical_conditions ||
                          "Not provided"
                        }
                      />

                      <InfoCard
                        label="Allergies"
                        value={
                          patient.allergies ||
                          "None recorded"
                        }
                      />

                      <InfoCard
                        label="Medicines"
                        value={String(
                          patient.medicine_count
                        )}
                      />

                      <InfoCard
                        label="Missed today"
                        value={String(
                          patient.missed_today
                        )}
                      />

                      <InfoCard
                        label="Adherence"
                        value={`${patient.adherence}%`}
                      />

                    </div>


                    {/* ADHERENCE */}

                    <div className="mt-5">

                      <div className="flex items-center justify-between">

                        <p className="text-xs font-semibold text-muted-foreground">
                          Medication adherence
                        </p>

                        <p className="text-xs font-bold">
                          {patient.adherence}%
                        </p>

                      </div>

                      <Progress
                        value={
                          patient.adherence
                        }
                        className="mt-2 h-2"
                      />

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {patient.taken} taken ·{" "}
                        {patient.missed} missed ·{" "}
                        {patient.total_reminders} recorded reminders
                      </p>

                    </div>


                    {/* ACTIONS */}

                    <div className="mt-5 flex flex-wrap gap-2">

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {

                          if (isExpanded) {
                            setExpandedPatient(null);
                            return;
                          }

                          loadMedicines(
                            patient.id
                          );
                        }}
                        disabled={
                          loadingMedicines ===
                          patient.id
                        }
                      >

                        <Pill className="size-4" />

                        {loadingMedicines ===
                        patient.id
                          ? "Loading..."
                          : isExpanded
                            ? "Hide medicines"
                            : "View medicines"}

                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}

                      </Button>

                    </div>

                  </div>


                  {/* MEDICINES */}

                  {isExpanded && (

                    <div className="border-t border-border/70 bg-muted/20 p-5">

                      <div className="mb-4">

                        <h4 className="text-sm font-bold">
                          Active medicines
                        </h4>

                        <p className="text-xs text-muted-foreground">
                          Current medication schedule for this patient.
                        </p>

                      </div>


                      {patientMedicines.length === 0 ? (

                        <div className="rounded-xl border border-dashed border-border p-6 text-center">

                          <Pill className="mx-auto size-7 text-muted-foreground" />

                          <p className="mt-2 text-sm font-semibold">
                            No active medicines
                          </p>

                        </div>

                      ) : (

                        <div className="grid gap-3 md:grid-cols-2">

                          {patientMedicines.map(
                            (medicine) => (

                              <div
                                key={medicine.id}
                                className="rounded-xl border border-border/70 bg-card p-4"
                              >

                                <div className="flex items-start justify-between gap-3">

                                  <div>

                                    <p className="text-sm font-bold">
                                      {medicine.medicine_name}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {medicine.dosage}
                                      {" · "}
                                      {medicine.frequency}
                                    </p>

                                  </div>

                                  <Clock3 className="size-4 text-muted-foreground" />

                                </div>


                                <div className="mt-4 grid grid-cols-2 gap-2">

                                  <InfoCard
                                    label="Reminder"
                                    value={
                                      medicine.reminder_time
                                    }
                                  />

                                  <InfoCard
                                    label="Remaining"
                                    value={String(
                                      medicine.remaining_quantity
                                    )}
                                  />

                                </div>


                                {medicine.instructions && (
                                  <p className="mt-3 text-xs text-muted-foreground">
                                    {medicine.instructions}
                                  </p>
                                )}


                                <Button
                                  size="sm"
                                  className="mt-4 w-full"
                                  onClick={() =>
                                    sendReminder(
                                      patient.id,
                                      medicine.id
                                    )
                                  }
                                >
                                  Send reminder
                                </Button>

                              </div>
                            )
                          )}

                        </div>

                      )}

                    </div>
                  )}


                  {/* ALERTS */}

                  {patient.alerts.length > 0 && (

                    <div className="border-t border-border/70 p-5">

                      <h4 className="text-sm font-bold">
                        Patient alerts
                      </h4>


                      <div className="mt-3 space-y-2">

                        {patient.alerts
                          .slice(0, 3)
                          .map((alert) => (

                            <div
                              key={String(
                                alert.id
                              )}
                              className="rounded-xl border border-destructive/20 bg-destructive/5 p-3"
                            >

                              <div className="flex gap-3">

                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />

                                <div>

                                  <p className="text-xs font-bold">
                                    {alert.title}
                                  </p>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {alert.message}
                                  </p>

                                </div>

                              </div>

                            </div>

                          ))}

                      </div>

                    </div>

                  )}

                </div>
              );
            })}

          </div>

        )}

      </Card>

    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">

      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-semibold">
        {value}
      </p>

    </div>
  );
}