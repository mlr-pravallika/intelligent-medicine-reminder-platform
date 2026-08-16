import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
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
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";


type Profile = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;

  dob?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  height?: string | null;
  weight?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  preferred_language?: string | null;
  address?: string | null;
};


export const Route =
  createFileRoute(
    "/caregiver/profile"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Caregiver Profile — MediCare AI",
        },
        {
          name: "description",
          content:
            "Manage your MediCare AI caregiver profile.",
        },
      ],
    }),

    component:
      CaregiverProfile,
  });


function getInitials(
  name: string
) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(
      (part) => part[0]
    )
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


function CaregiverProfile() {

  const [
    profile,
    setProfile,
  ] = useState<Profile | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    const loadProfile =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await api.get<Profile>(
              "/me"
            );

          setProfile(
            response.data
          );

        } catch (error) {

          console.error(error);

          const err =
            error as AxiosError<{
              detail?: string;
            }>;

          setError(
            err.response?.data?.detail ||
              "Unable to load profile."
          );

        } finally {

          setLoading(false);
        }
      };


    loadProfile();

  }, []);


  const updateField = <
    K extends keyof Profile
  >(
    field: K,
    value: Profile[K]
  ) => {

    setProfile(
      (current) =>
        current
          ? {
              ...current,
              [field]: value,
            }
          : current
    );
  };


  const saveProfile =
    async () => {

      if (!profile) {
        return;
      }


      try {

        setSaving(true);


        const response =
          await api.put<Profile>(
            `/profile/${profile.id}`,
            {
              name:
                profile.name,

              phone:
                profile.phone,

              dob:
                profile.dob || null,

              gender:
                profile.gender || null,

              blood_group:
                profile.blood_group ||
                null,

              height:
                profile.height || null,

              weight:
                profile.weight || null,

              allergies:
                profile.allergies ||
                null,

              medical_conditions:
                profile.medical_conditions ||
                null,

              preferred_language:
                profile.preferred_language ||
                null,

              address:
                profile.address ||
                null,
            }
          );


        setProfile(
          response.data
        );


        toast.success(
          "Profile updated successfully."
        );


        window.location.reload();

      } catch (error) {

        console.error(error);

        const err =
          error as AxiosError<{
            detail?: string;
          }>;

        toast.error(
          err.response?.data?.detail ||
            "Unable to update profile."
        );

      } finally {

        setSaving(false);
      }
    };


  if (loading) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title="My Profile"
          description="Loading your caregiver profile..."
        />

        <Card className="p-8">
          Loading profile...
        </Card>

      </div>
    );
  }


  if (error || !profile) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title="My Profile"
          description="Your caregiver account information."
        />

        <Card className="border-destructive/30 p-8">

          <div className="text-center">

            <AlertTriangle className="mx-auto size-9 text-destructive" />

            <p className="mt-3 font-semibold">
              {error || "Profile not found."}
            </p>

          </div>

        </Card>

      </div>
    );
  }


  return (
    <div className="space-y-6">

      <SectionHeading
        title="My Profile"
        description="Manage the information associated with your caregiver account."
      />


      {/* ======================================================
          PROFILE HEADER
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-4">

          <Avatar className="size-16">

            <AvatarFallback className="bg-primary-soft text-lg font-extrabold text-primary">

              {getInitials(
                profile.name
              )}

            </AvatarFallback>

          </Avatar>


          <div>

            <h2 className="text-xl font-bold">
              {profile.name}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {profile.email}
            </p>

            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">

              <CheckCircle2 className="size-3.5" />

              Caregiver account

            </div>

          </div>

        </div>

      </Card>


      {/* ======================================================
          BASIC INFORMATION
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <UserRound className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Basic information
            </h2>

            <p className="text-xs text-muted-foreground">
              Information used across your caregiver account.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-5 md:grid-cols-2">

          {/* FULL NAME */}

          <div className="space-y-2">

            <Label>
              Full name
            </Label>

            <Input
              value={profile.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              className="h-11 rounded-xl"
            />

          </div>


          {/* EMAIL */}

          <div className="space-y-2">

            <Label>
              Email address
            </Label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={profile.email}
                readOnly
                className="h-11 rounded-xl bg-muted/40 pl-9"
              />

            </div>

            <p className="text-[11px] text-muted-foreground">
              Email changes require account verification.
            </p>

          </div>


          {/* PHONE */}

          <div className="space-y-2">

            <Label>
              Phone number
            </Label>

            <div className="relative">

              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={
                  profile.phone || ""
                }
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                className="h-11 rounded-xl pl-9"
              />

            </div>

          </div>


          {/* DOB */}

          <div className="space-y-2">

            <Label>
              Date of birth
            </Label>

            <div className="relative">

              <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="date"
                value={
                  profile.dob || ""
                }
                onChange={(event) =>
                  updateField(
                    "dob",
                    event.target.value
                  )
                }
                className="h-11 rounded-xl pl-9"
              />

            </div>

          </div>


          {/* GENDER */}

          <div className="space-y-2">

            <Label>
              Gender
            </Label>

            <Input
              value={
                profile.gender || ""
              }
              onChange={(event) =>
                updateField(
                  "gender",
                  event.target.value
                )
              }
              placeholder="e.g. Female"
              className="h-11 rounded-xl"
            />

          </div>


          {/* LANGUAGE */}

          <div className="space-y-2">

            <Label>
              Preferred language
            </Label>

            <Input
              value={
                profile.preferred_language ||
                "English"
              }
              onChange={(event) =>
                updateField(
                  "preferred_language",
                  event.target.value
                )
              }
              className="h-11 rounded-xl"
            />

          </div>

        </div>

      </Card>


      {/* ======================================================
          CONTACT / LOCATION
      ====================================================== */}

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <MapPin className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Contact information
            </h2>

            <p className="text-xs text-muted-foreground">
              Keep your contact information up to date.
            </p>

          </div>

        </div>


        <div className="mt-6 space-y-2">

          <Label>
            Address
          </Label>

          <Textarea
            value={
              profile.address || ""
            }
            onChange={(event) =>
              updateField(
                "address",
                event.target.value
              )
            }
            placeholder="Enter your address..."
            className="min-h-28 rounded-xl"
          />

        </div>

      </Card>


      {/* ======================================================
          SAVE
      ====================================================== */}

      <div className="flex justify-end">

        <Button
          onClick={saveProfile}
          disabled={saving}
          className="bg-brand-gradient rounded-xl px-6"
        >

          <Save className="size-4" />

          {saving
            ? "Saving..."
            : "Save profile"}

        </Button>

      </div>

    </div>
  );
}