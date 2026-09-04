import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
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


type AdminProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
};


export const Route =
  createFileRoute(
    "/admin/profile"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Admin Profile — MediCare AI",
        },
      ],
    }),

    component:
      AdminProfilePage,
  });


function initials(
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


function AdminProfilePage() {

  const [
    profile,
    setProfile,
  ] = useState<AdminProfile | null>(
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

    const load =
      async () => {

        try {

          const response =
            await api.get<AdminProfile>(
              "/me"
            );

          setProfile(
            response.data
          );

        } catch (error) {

          const err =
            error as AxiosError<{
              detail?: string;
            }>;

          setError(
            err.response?.data?.detail ||
              "Unable to load admin profile."
          );

        } finally {

          setLoading(false);
        }
      };


    load();

  }, []);


  const saveProfile =
    async () => {

      if (!profile) {
        return;
      }

      try {

        setSaving(true);

        const response =
          await api.put<AdminProfile>(
            `/profile/${profile.id}`,
            {
              name:
                profile.name,

              phone:
                profile.phone,
            }
          );

        setProfile(
          response.data
        );

        toast.success(
          "Admin profile updated successfully."
        );

        window.location.reload();

      } catch (error) {

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
          description="Loading administrator profile..."
        />

        <Card className="p-8">
          Loading...
        </Card>

      </div>
    );
  }


  if (!profile) {

    return (
      <div className="space-y-6">

        <SectionHeading
          title="My Profile"
          description="Administrator account information."
        />

        <Card className="p-8">

          <div className="text-center">

            <AlertTriangle className="mx-auto size-9 text-destructive" />

            <p className="mt-3 font-semibold">
              {error ||
                "Profile unavailable."}
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
        description="Manage your administrator account information."
      />


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-4">

          <Avatar className="size-16">

            <AvatarFallback className="bg-primary-soft text-lg font-extrabold text-primary">
              {initials(profile.name)}
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

              <ShieldCheck className="size-3.5" />

              Administrator

            </div>

          </div>

        </div>

      </Card>


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">

            <UserRound className="size-5" />

          </div>

          <div>

            <h2 className="font-bold">
              Account information
            </h2>

            <p className="text-xs text-muted-foreground">
              Information associated with your administrator account.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-5 md:grid-cols-2">

          <div className="space-y-2">

            <Label>
              Full name
            </Label>

            <Input
              value={profile.name}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  name:
                    event.target.value,
                })
              }
              className="h-11 rounded-xl"
            />

          </div>


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

          </div>


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
                  setProfile({
                    ...profile,
                    phone:
                      event.target.value,
                  })
                }
                className="h-11 rounded-xl pl-9"
              />

            </div>

          </div>

        </div>

      </Card>


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