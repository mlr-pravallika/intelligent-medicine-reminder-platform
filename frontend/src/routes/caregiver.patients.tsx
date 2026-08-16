import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock3,
  Mail,
  Pill,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";


type Patient = {
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
};


type Medicine = {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  instructions?: string | null;
  remaining_quantity: number;
  tablets_per_day: number;
  is_active?: boolean;
};


export const Route = createFileRoute(
  "/caregiver/patients"
)({
  head: () => ({
    meta: [
      {
        title:
          "Assigned Patients — MediCare AI",
      },
      {
        name: "description",
        content:
          "View and monitor patients assigned to your caregiver account.",
      },
    ],
  }),

  component: AssignedPatientsPage,
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


function AssignedPatientsPage() {
  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [medicines, setMedicines] =
    useState<Record<number, Medicine[]>>({});

  const [loading, setLoading] =
    useState(true);

  const [selectedPatient, setSelectedPatient] =
    useState<number | null>(null);

  const [loadingMedicines, setLoadingMedicines] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");


  const loadPatients = async () => {
    try {
      setLoading(true);

      const response =
        await api.get<Patient[]>(
          "/caregiver/patients"
        );

      setPatients(response.data);

    } catch (error) {
      console.error(error);

      const err =
        error as AxiosError<{
          detail?: string;
        }>;

      toast.error(
        err.response?.data?.detail ||
          "Unable to load assigned patients."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadPatients();
  }, []);


  const loadMedicines = async (
    patientId: number
  ) => {
    try {
      setLoadingMedicines(patientId);

      const response =
        await api.get<Medicine[]>(
          `/caregiver/patients/${patientId}/medicines`
        );

      setMedicines((current) => ({
        ...current,
        [patientId]: response.data,
      }));

      setSelectedPatient(patientId);

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
        "Reminder sent successfully."
      );

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


  const filteredPatients =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return patients;
      }

      return patients.filter(
        (patient) =>
          patient.name
            .toLowerCase()
            .includes(query) ||
          patient.email
            .toLowerCase()
            .includes(query)
      );
    }, [patients, search]);


  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Assigned Patients"
          description="Loading your assigned patients..."
        />

        <Card className="p-10">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="size-5 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading patient data...
            </span>
          </div>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Assigned Patients"
        description="Monitor patient profiles, medicines, adherence and medication status."
      />


      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="text-sm text-muted-foreground">
          {patients.length} assigned patient
          {patients.length === 1 ? "" : "s"}
        </div>


        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search patients..."
          className="h-10 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
        />

      </div>


      {filteredPatients.length === 0 ? (
        <Card className="p-10 text-center">

          <UserRound className="mx-auto size-10 text-muted-foreground" />

          <h3 className="mt-4 font-bold">
            No patients found
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            No patients are currently assigned to
            your caregiver account.
          </p>

        </Card>
      ) : (

        <div className="space-y-4">

          {filteredPatients.map((patient) => {

            const isSelected =
              selectedPatient === patient.id;

            const patientMedicines =
              medicines[patient.id] ?? [];


            return (
              <Card
                key={patient.id}
                className="overflow-hidden rounded-2xl border-border/70 p-0 shadow-soft"
              >

                <div className="p-6">

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <div className="flex min-w-0 gap-4">

                      <Avatar className="size-12 shrink-0">
                        <AvatarFallback className="bg-primary-soft font-bold text-primary">
                          {getInitials(
                            patient.name
                          )}
                        </AvatarFallback>
                      </Avatar>


                      <div className="min-w-0">

                        <h2 className="truncate text-lg font-bold">
                          {patient.name}
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Patient ID: {patient.id}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {patient.email}
                        </p>

                      </div>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      {patient.email && (
                        <a
                          href={`mailto:${patient.email}`}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                        >
                          <Mail className="size-3.5" />
                          Email
                        </a>
                      )}


                      {patient.phone && (
                        <a
                          href={`tel:${patient.phone}`}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                        >
                          <Phone className="size-3.5" />
                          Call
                        </a>
                      )}

                    </div>

                  </div>


                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Medicines
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {patient.medicine_count}
                      </p>
                    </div>


                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Adherence
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {patient.adherence}%
                      </p>
                    </div>


                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Taken
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {patient.taken}
                      </p>
                    </div>


                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Missed
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {patient.missed}
                      </p>
                    </div>


                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Alerts
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {patient.critical_alerts}
                      </p>
                    </div>

                  </div>


                  <div className="mt-5">

                    <div className="flex items-center justify-between text-xs">

                      <span className="font-semibold text-muted-foreground">
                        Medication adherence
                      </span>

                      <span className="font-bold">
                        {patient.adherence}%
                      </span>

                    </div>

                    <Progress
                      value={patient.adherence}
                      className="mt-2 h-2"
                    />

                  </div>


                  <div className="mt-5 flex flex-wrap gap-2">

                    <Button
                      variant="outline"
                      onClick={() => {

                        if (isSelected) {
                          setSelectedPatient(null);
                          return;
                        }

                        loadMedicines(patient.id);
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
                        : isSelected
                          ? "Hide medicines"
                          : "View medicines"}
                    </Button>

                  </div>

                </div>


                {isSelected && (

                  <div className="border-t border-border/70 bg-muted/20 p-6">

                    <div className="mb-4">

                      <h3 className="font-bold">
                        Active medicines
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Current medication schedule for
                        {patient.name}.
                      </p>

                    </div>


                    {patientMedicines.length === 0 ? (

                      <div className="rounded-xl border border-dashed border-border p-8 text-center">

                        <Pill className="mx-auto size-8 text-muted-foreground" />

                        <p className="mt-3 text-sm font-semibold">
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

                              <div className="flex items-start justify-between">

                                <div>
                                  <h4 className="font-bold">
                                    {medicine.medicine_name}
                                  </h4>

                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {medicine.dosage}
                                    {" · "}
                                    {medicine.frequency}
                                  </p>
                                </div>

                                <Clock3 className="size-4 text-muted-foreground" />

                              </div>


                              <div className="mt-4 grid grid-cols-2 gap-2">

                                <div className="rounded-lg bg-muted/50 p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">
                                    Reminder
                                  </p>
                                  <p className="mt-1 text-xs font-bold">
                                    {medicine.reminder_time}
                                  </p>
                                </div>


                                <div className="rounded-lg bg-muted/50 p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">
                                    Remaining
                                  </p>
                                  <p className="mt-1 text-xs font-bold">
                                    {medicine.remaining_quantity}
                                  </p>
                                </div>

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

              </Card>
            );
          })}

        </div>
      )}

    </div>
  );
}
