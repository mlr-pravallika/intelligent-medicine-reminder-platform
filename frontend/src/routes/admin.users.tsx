import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  Search,
  UserCheck,
  UserRound,
  Users,
  RefreshCw,
  Link2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
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
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";


type UserRecord = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at?: string | null;
};


type Assignment = {
  id: number;
  caregiver_id: number;
  caregiver_name: string;
  patient_id: number;
  patient_name: string;
  assigned_at?: string | null;
};


export const Route =
  createFileRoute(
    "/admin/users"
  )({
    head: () => ({
      meta: [
        {
          title:
            "User Management — MediCare AI",
        },
      ],
    }),

    component:
      AdminUsers,
  });


function AdminUsers() {

  const [
    users,
    setUsers,
  ] = useState<UserRecord[]>(
    []
  );

  const [
    patients,
    setPatients,
  ] = useState<UserRecord[]>(
    []
  );

  const [
    caregivers,
    setCaregivers,
  ] = useState<UserRecord[]>(
    []
  );

  const [
    assignments,
    setAssignments,
  ] = useState<Assignment[]>(
    []
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("all");

  const [
    selectedPatient,
    setSelectedPatient,
  ] = useState("");

  const [
    selectedCaregiver,
    setSelectedCaregiver,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);


  const loadData =
    async () => {

      try {

        setLoading(true);


        const [
          usersResponse,
          patientsResponse,
          caregiversResponse,
          assignmentsResponse,
        ] = await Promise.all([
          api.get<UserRecord[]>(
            "/admin/users"
          ),
          api.get<UserRecord[]>(
            "/admin/patients"
          ),
          api.get<UserRecord[]>(
            "/admin/caregivers"
          ),
          api.get<Assignment[]>(
            "/admin/assignments"
          ),
        ]);


        setUsers(
          usersResponse.data
        );

        setPatients(
          patientsResponse.data
        );

        setCaregivers(
          caregiversResponse.data
        );

        setAssignments(
          assignmentsResponse.data
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
            "Unable to load admin user data."
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {
    loadData();
  }, []);


  const filteredUsers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return users.filter(
        (user) => {

          const matchesSearch =
            !query ||
            user.name
              .toLowerCase()
              .includes(query) ||
            user.email
              .toLowerCase()
              .includes(query);


          const matchesRole =
            roleFilter === "all" ||
            user.role === roleFilter;


          return (
            matchesSearch &&
            matchesRole
          );
        }
      );

    }, [
      users,
      search,
      roleFilter,
    ]);


  const assignPatient =
    async () => {

      if (
        !selectedPatient ||
        !selectedCaregiver
      ) {

        toast.error(
          "Select both a patient and caregiver."
        );

        return;
      }


      try {

        await api.post(
          "/admin/assign-caregiver",
          null,
          {
            params: {
              caregiver_id:
                Number(
                  selectedCaregiver
                ),
              patient_id:
                Number(
                  selectedPatient
                ),
            },
          }
        );


        toast.success(
          "Patient assigned successfully."
        );


        setSelectedPatient("");
        setSelectedCaregiver("");

        await loadData();

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
            "Unable to assign patient."
        );
      }
    };


  if (loading) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title="User Management"
          description="Loading users..."
        />

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            Loading user data...

          </div>

        </Card>

      </div>
    );
  }


  return (
    <div className="space-y-6">

      <SectionHeading
        title="User Management"
        description="Manage patients, caregivers and administrator accounts."
      />


      {/* ======================================================
          ASSIGNMENT
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <Link2 className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Assign patient to caregiver
            </h2>

            <p className="text-xs text-muted-foreground">
              Connect an existing patient account to an existing caregiver.
            </p>

          </div>

        </div>


        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">

          <select
            value={selectedPatient}
            onChange={(event) =>
              setSelectedPatient(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
          >

            <option value="">
              Select patient
            </option>

            {patients.map(
              (patient) => (

                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.name} —{" "}
                  {patient.email}
                </option>

              )
            )}

          </select>


          <select
            value={selectedCaregiver}
            onChange={(event) =>
              setSelectedCaregiver(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
          >

            <option value="">
              Select caregiver
            </option>

            {caregivers.map(
              (caregiver) => (

                <option
                  key={caregiver.id}
                  value={caregiver.id}
                >
                  {caregiver.name} —{" "}
                  {caregiver.email}
                </option>

              )
            )}

          </select>


          <Button
            onClick={
              assignPatient
            }
            className="rounded-xl"
          >
            Assign
          </Button>

        </div>

      </Card>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-4 shadow-soft">

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name or email..."
              className="h-11 rounded-xl pl-9"
            />

          </div>


          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-border bg-background px-4 text-sm"
          >

            <option value="all">
              All roles
            </option>

            <option value="patient">
              Patients
            </option>

            <option value="caregiver">
              Caregivers
            </option>

            <option value="admin">
              Administrators
            </option>

          </select>

        </div>

      </Card>


      {/* ======================================================
          USER TABLE
      ====================================================== */}

      <Card className="overflow-x-auto rounded-2xl border-border/70 p-0 shadow-soft">

        <div className="min-w-[760px]">

          <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr] border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">

            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Registered</span>

          </div>


          {filteredUsers.length === 0 ? (

            <div className="p-10 text-center text-sm text-muted-foreground">
              No users match your search.
            </div>

          ) : (

            filteredUsers.map(
              (user) => (

                <div
                  key={user.id}
                  className="grid grid-cols-[2fr_2fr_1fr_1.5fr] items-center border-b border-border/60 px-5 py-4 last:border-b-0"
                >

                  <div className="flex items-center gap-3">

                    <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">

                      {user.role === "caregiver" ? (
                        <UserCheck className="size-4" />
                      ) : user.role === "patient" ? (
                        <UserRound className="size-4" />
                      ) : (
                        <Users className="size-4" />
                      )}

                    </div>


                    <div>

                      <p className="text-sm font-bold">
                        {user.name}
                      </p>

                      <p className="text-[11px] text-muted-foreground">
                        ID: {user.id}
                      </p>

                    </div>

                  </div>


                  <p className="truncate pr-4 text-sm text-muted-foreground">
                    {user.email}
                  </p>


                  <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold capitalize text-primary">
                    {user.role}
                  </span>


                  <p className="text-xs text-muted-foreground">
                    {user.created_at
                      ? new Date(
                          user.created_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "—"}
                  </p>

                </div>

              )
            )

          )}

        </div>

      </Card>


      {/* ======================================================
          ASSIGNMENTS
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="Current caregiver assignments"
          description="Patient-caregiver relationships currently stored in the platform."
        />


        {assignments.length === 0 ? (

          <p className="mt-5 text-sm text-muted-foreground">
            No caregiver assignments yet.
          </p>

        ) : (

          <div className="mt-5 space-y-2">

            {assignments.map(
              (assignment) => (

                <div
                  key={assignment.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <p className="text-sm font-bold">
                      {assignment.patient_name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Caregiver:{" "}
                      {assignment.caregiver_name}
                    </p>

                  </div>


                  <p className="text-xs text-muted-foreground">
                    {assignment.assigned_at
                      ? new Date(
                          assignment.assigned_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "Date unavailable"}
                  </p>

                </div>

              )
            )}

          </div>

        )}

      </Card>

    </div>
  );
}