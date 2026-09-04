import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  HeartPulse,
  Lock,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  getProfile,
  updateProfile,
} from "@/services/profileService";

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Textarea,
} from "@/components/ui/textarea";


export const Route = createFileRoute(
  "/patient/profile",
)({
  head: () => ({
    meta: [
      {
        title:
          "Profile - MediCare AI",
      },
      {
        name: "description",
        content:
          "Manage personal, medical, doctor and security information.",
      },
    ],
  }),

  component: ProfilePage,
});


type Profile = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  dob: string;
  gender: string;
  blood_group: string;
  height: string;
  weight: string;
  allergies: string;
  medical_conditions: string;
  preferred_language: string;
  address: string;
};


type Doctor = {
  doctor_name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
};


const emptyDoctor: Doctor = {
  doctor_name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: "",
};


function normalizeProfile(
  data: any,
): Profile {
  return {
    id: Number(
      data?.id ?? 0,
    ),
    name:
      data?.name ?? "",
    email:
      data?.email ?? "",
    role:
      data?.role ?? "patient",
    phone:
      data?.phone ?? "",
    dob:
      data?.dob ?? "",
    gender:
      data?.gender ?? "",
    blood_group:
      data?.blood_group ?? "",
    height:
      data?.height ?? "",
    weight:
      data?.weight ?? "",
    allergies:
      data?.allergies ?? "",
    medical_conditions:
      data?.medical_conditions ??
      "",
    preferred_language:
      data?.preferred_language ??
      "English",
    address:
      data?.address ?? "",
  };
}


function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>

      <Input
        id={id}
        type={type}
        value={
          value ?? ""
        }
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-11 rounded-xl"
      />
    </div>
  );
}


function ProfilePage() {
  const [
    profile,
    setProfile,
  ] = useState<Profile | null>(
    null,
  );

  const [
    doctor,
    setDoctor,
  ] = useState<Doctor>(
    emptyDoctor,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const data =
          await getProfile();

        setProfile(
          normalizeProfile(
            data,
          ),
        );

        /*
         * The current profile API you shared returns the user profile,
         * but it does not expose doctor/insurance records.
         *
         * Keep doctor details locally on this page until a dedicated
         * doctor API is available.
         */
      } catch (error) {
        console.error(
          "Profile loading error:",
          error,
        );

        toast.error(
          "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);


  const updateField = (
    field: keyof Profile,
    value: string,
  ) => {
    setProfile(
      current =>
        current
          ? {
              ...current,
              [field]: value,
            }
          : current,
    );
  };


  const saveProfile = async () => {
    if (!profile) {
      return;
    }

    if (!profile.name.trim()) {
      toast.error(
        "Name is required.",
      );
      return;
    }

    if (!profile.phone.trim()) {
      toast.error(
        "Phone number is required.",
      );
      return;
    }

    try {
      setSaving(true);

      await updateProfile(
        profile.id,
        {
          name:
            profile.name.trim(),
          phone:
            profile.phone.trim(),
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
            profile.allergies || null,
          medical_conditions:
            profile.medical_conditions ||
            null,
          preferred_language:
            profile.preferred_language ||
            "English",
          address:
            profile.address || null,
        } as any,
      );

      const refreshed =
        await getProfile();

      setProfile(
        normalizeProfile(
          refreshed,
        ),
      );

      toast.success(
        "Profile updated successfully.",
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error,
      );

      toast.error(
        "Unable to update the profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };


  const saveDoctorDetails = () => {
    const cleaned: Doctor = {
      doctor_name:
        doctor.doctor_name.trim(),
      specialization:
        doctor.specialization.trim(),
      hospital:
        doctor.hospital.trim(),
      phone:
        doctor.phone.trim(),
      email:
        doctor.email.trim(),
    };

    if (!cleaned.doctor_name) {
      toast.error(
        "Doctor name is required.",
      );
      return;
    }

    setDoctor(cleaned);

    localStorage.setItem(
      "medicare_patient_doctor",
      JSON.stringify(
        cleaned,
      ),
    );

    toast.success(
      "Doctor details saved successfully.",
    );
  };


  useEffect(() => {
    const saved =
      localStorage.getItem(
        "medicare_patient_doctor",
      );

    if (!saved) {
      return;
    }

    try {
      const parsed =
        JSON.parse(
          saved,
        );

      setDoctor({
        ...emptyDoctor,
        ...parsed,
      });
    } catch {
      // Ignore malformed local data.
    }
  }, []);


  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }


  if (!profile) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Profile could not be loaded.
        </p>

        <Button
          className="mt-4 rounded-full"
          onClick={() =>
            window.location.reload()
          }
        >
          Retry
        </Button>
      </div>
    );
  }


  const nameParts =
    profile.name
      .trim()
      .split(/\s+/);

  const firstName =
    nameParts[0] ?? "";

  const lastName =
    nameParts
      .slice(1)
      .join(" ");


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Profile"
        description="Keep your personal and clinical information current."
      />


      <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex flex-wrap items-center gap-4">

          <Avatar className="size-16 shrink-0">
            <AvatarFallback className="bg-primary-soft text-lg font-extrabold text-primary">
              {profile.name
                ?.charAt(0)
                ?.toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>


          <div className="min-w-0">

            <p className="truncate text-lg font-extrabold text-foreground">
              {profile.name}
            </p>

            <p className="truncate text-sm capitalize text-muted-foreground">
              {profile.role} |{" "}
              {profile.email}
            </p>

          </div>

        </div>

      </Card>


      <Tabs defaultValue="personal">

        <TabsList className="flex-wrap rounded-full">

          <TabsTrigger
            value="personal"
            className="rounded-full"
          >
            Personal
          </TabsTrigger>

          <TabsTrigger
            value="medical"
            className="rounded-full"
          >
            Medical
          </TabsTrigger>

          <TabsTrigger
            value="doctors"
            className="rounded-full"
          >
            Doctors
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="rounded-full"
          >
            Security
          </TabsTrigger>

        </TabsList>


        <TabsContent
          value="personal"
          className="mt-5"
        >

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Personal information"
              action={
                <UserRound className="size-5 text-primary" />
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Field
                id="p-first"
                label="First name"
                value={
                  firstName
                }
                onChange={value =>
                  updateField(
                    "name",
                    lastName
                      ? `${value} ${lastName}`
                      : value,
                  )
                }
              />

              <Field
                id="p-last"
                label="Last name"
                value={
                  lastName
                }
                onChange={value =>
                  updateField(
                    "name",
                    value
                      ? `${firstName} ${value}`
                      : firstName,
                  )
                }
              />

              <Field
                id="p-email"
                label="Email"
                value={
                  profile.email
                }
                onChange={() => {}}
                type="email"
                disabled
              />

              <Field
                id="p-phone"
                label="Phone"
                value={
                  profile.phone
                }
                onChange={value =>
                  updateField(
                    "phone",
                    value,
                  )
                }
                type="tel"
              />

              <Field
                id="p-dob"
                label="Date of birth"
                value={
                  profile.dob
                }
                onChange={value =>
                  updateField(
                    "dob",
                    value,
                  )
                }
                type="date"
              />

              <Field
                id="p-gender"
                label="Gender"
                value={
                  profile.gender
                }
                onChange={value =>
                  updateField(
                    "gender",
                    value,
                  )
                }
              />

              <Field
                id="p-language"
                label="Preferred language"
                value={
                  profile.preferred_language
                }
                onChange={value =>
                  updateField(
                    "preferred_language",
                    value,
                  )
                }
              />

              <Field
                id="p-address"
                label="Address"
                value={
                  profile.address
                }
                onChange={value =>
                  updateField(
                    "address",
                    value,
                  )
                }
              />

            </div>


            <Button
              className="mt-6 rounded-full bg-brand-gradient font-semibold shadow-glow"
              onClick={
                saveProfile
              }
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </Button>

          </Card>

        </TabsContent>


        <TabsContent
          value="medical"
          className="mt-5"
        >

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Medical information"
              action={
                <HeartPulse className="size-5 text-destructive" />
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Field
                id="blood-group"
                label="Blood group"
                value={
                  profile.blood_group
                }
                onChange={value =>
                  updateField(
                    "blood_group",
                    value,
                  )
                }
              />

              <Field
                id="height"
                label="Height"
                value={
                  profile.height
                }
                onChange={value =>
                  updateField(
                    "height",
                    value,
                  )
                }
              />

              <Field
                id="weight"
                label="Weight"
                value={
                  profile.weight
                }
                onChange={value =>
                  updateField(
                    "weight",
                    value,
                  )
                }
              />

              <Field
                id="allergies"
                label="Known allergies"
                value={
                  profile.allergies
                }
                onChange={value =>
                  updateField(
                    "allergies",
                    value,
                  )
                }
              />

            </div>


            <div className="mt-4 space-y-2">

              <Label htmlFor="conditions">
                Health conditions
              </Label>

              <Textarea
                id="conditions"
                value={
                  profile.medical_conditions
                }
                onChange={event =>
                  updateField(
                    "medical_conditions",
                    event.target.value,
                  )
                }
                className="min-h-28 rounded-xl"
              />

            </div>


            <Button
              className="mt-6 rounded-full bg-brand-gradient font-semibold shadow-glow"
              onClick={
                saveProfile
              }
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save medical information"}
            </Button>

          </Card>

        </TabsContent>


        <TabsContent
          value="doctors"
          className="mt-5"
        >

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Doctor information"
              action={
                <Stethoscope className="size-5 text-accent" />
              }
            />

            <p className="mt-2 text-sm text-muted-foreground">
              Keep your primary doctor information available for quick reference.
            </p>


            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <Field
                id="doctor-name"
                label="Doctor name"
                value={
                  doctor.doctor_name
                }
                onChange={value =>
                  setDoctor(
                    current => ({
                      ...current,
                      doctor_name:
                        value,
                    }),
                  )
                }
              />

              <Field
                id="doctor-specialization"
                label="Specialization"
                value={
                  doctor.specialization
                }
                onChange={value =>
                  setDoctor(
                    current => ({
                      ...current,
                      specialization:
                        value,
                    }),
                  )
                }
              />

              <Field
                id="doctor-hospital"
                label="Hospital / Clinic"
                value={
                  doctor.hospital
                }
                onChange={value =>
                  setDoctor(
                    current => ({
                      ...current,
                      hospital:
                        value,
                    }),
                  )
                }
              />

              <Field
                id="doctor-phone"
                label="Doctor phone"
                value={
                  doctor.phone
                }
                onChange={value =>
                  setDoctor(
                    current => ({
                      ...current,
                      phone:
                        value,
                    }),
                  )
                }
                type="tel"
              />

              <Field
                id="doctor-email"
                label="Doctor email"
                value={
                  doctor.email
                }
                onChange={value =>
                  setDoctor(
                    current => ({
                      ...current,
                      email:
                        value,
                    }),
                  )
                }
                type="email"
              />

            </div>


            <Button
              className="mt-6 rounded-full bg-brand-gradient font-semibold shadow-glow"
              onClick={
                saveDoctorDetails
              }
            >
              Save doctor details
            </Button>

          </Card>

        </TabsContent>


        <TabsContent
          value="security"
          className="mt-5"
        >

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Security and privacy"
              action={
                <Lock className="size-5 text-primary" />
              }
            />

            <div className="mt-6 rounded-xl border border-border/70 p-4">

              <div className="flex items-start gap-3">

                <Phone className="mt-0.5 size-5 text-primary" />

                <div>

                  <p className="font-semibold">
                    Account information
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Your email address is linked to your account and cannot be edited from this page.
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <Field
                id="current-password"
                label="Current password"
                value=""
                onChange={() => {}}
                type="password"
              />

              <Field
                id="new-password"
                label="New password"
                value=""
                onChange={() => {}}
                type="password"
              />

            </div>

            <Button
              variant="outline"
              className="mt-6 rounded-full font-semibold"
              onClick={() =>
                toast.info(
                  "Password change requires the password reset flow.",
                )
              }
            >
              Password settings
            </Button>

          </Card>

        </TabsContent>

      </Tabs>

    </div>
  );
}
