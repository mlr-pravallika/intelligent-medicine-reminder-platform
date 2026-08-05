import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Lock, Phone, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/services/profileService";

import { SectionHeading } from "@/components/portal/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/patient/profile")({
  head: () => ({
    meta: [
      { title: "Profile — MediCare AI" },
      { name: "description", content: "Personal, medical, doctor, insurance and security details for your account." },
      { property: "og:title", content: "Profile — MediCare AI" },
      { property: "og:description", content: "Manage your healthcare profile and emergency contacts." },
    ],
  }),
  component: ProfilePage,
});

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>

      <Input
        id={id}
        type={type}
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-11 rounded-xl"
      />
    </div>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      console.log(data);
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveProfile = async () => {
    try {
      await updateProfile(
        profile.id,
        {
          name: profile.name,
          phone: profile.phone,
          dob: profile.dob,
          gender: profile.gender,
          blood_group: profile.blood_group,
          height: profile.height,
          weight: profile.weight,
          allergies: profile.allergies,
          medical_conditions: profile.medical_conditions,
          preferred_language: profile.preferred_language,
          address: profile.address,
        } as any
      );

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Update failed");
    }
  };

  if (!profile) {
    return (
      <div className="p-10 text-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Profile" description="Keep your clinical and contact information current for accurate care." />

      <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="size-16 shrink-0">
              <AvatarFallback className="bg-primary-soft text-lg font-extrabold text-primary">{profile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-foreground">{profile.name}</p>
              <p className="truncate text-sm text-muted-foreground">{profile.role} • {profile.email}</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full font-semibold" onClick={() => toast.success("Profile picture updated")}>
            Change photo
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="flex-wrap rounded-full">
          <TabsTrigger value="personal" className="rounded-full">Personal</TabsTrigger>
          <TabsTrigger value="medical" className="rounded-full">Medical</TabsTrigger>
          <TabsTrigger value="doctors" className="rounded-full">Doctors</TabsTrigger>
          <TabsTrigger value="insurance" className="rounded-full">Insurance</TabsTrigger>
          <TabsTrigger value="security" className="rounded-full">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-5">
          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Personal information" action={<UserRound className="size-5 text-primary" aria-hidden="true" />} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="p-first" label="First name" value={profile.name?.split(" ")[0]} onChange={(value) => setProfile({...profile, name: `${value} ${profile.name?.split(" ")[1]}`})} />
              <Field id="p-last" label="Last name" value={profile.name?.split(" ")[1]} onChange={(value) => setProfile({...profile, name: `${profile.name?.split(" ")[0]} ${value}`})} />
              <Field id="p-email" label="Email" value={profile.email} onChange={(value) => setProfile({...profile, email: value})} type="email" />
              <Field id="p-phone" label="Phone" value={profile.phone} onChange={(value) => setProfile({...profile, phone: value})} type="tel" />
              <Field id="p-dob" label="Date of birth" value={profile.dob} onChange={(value) => setProfile({...profile, dob: value})} type="date" />
              <Field id="p-lang" label="Preferred language" value={profile.language} onChange={(value) => setProfile({...profile, language: value})} />
            </div>

            <Button className="bg-brand-gradient mt-6 rounded-full font-semibold shadow-glow" onClick={saveProfile}>
              Save changes
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="mt-5">
          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Medical information" action={<HeartPulse className="size-5 text-destructive" aria-hidden="true" />} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
              id="blood"
              label="Blood Group"
              value={profile.blood_group}
              onChange={(value)=>
              setProfile({
              ...profile,
              blood_group:value
              })
              }
              />
              <Field id="height" label="Height" value={profile.height} onChange={(value) => setProfile({ ...profile, height: value })} />
              <Field id="weight" label="Weight (kg)" value={profile.weight} onChange={(value) => setProfile({ ...profile, weight: value })} />
              <Field id="allergies" label="Known allergies" value={profile.allergies} onChange={(value) => setProfile({ ...profile, allergies: value })} />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="m-conditions">Health conditions</Label>
              <Textarea id="m-conditions" value={profile.medical_conditions} onChange={(value) => setProfile({ ...profile, medical_conditions: value })} className="min-h-28 rounded-xl" />
            </div>
            <Button className="bg-brand-gradient mt-6 rounded-full font-semibold shadow-glow" onClick={() => toast.success("Medical information saved")}>
              Save changes
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="mt-5">
  <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

    <SectionHeading
      title="Doctor Information"
      action={<Stethoscope className="size-5 text-accent" />}
    />

    <div className="mt-8 text-center text-muted-foreground">

      Doctor management will be available in a future update.

    </div>

  </Card>
</TabsContent>

<TabsContent value="insurance" className="mt-5">

  <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

    <SectionHeading
      title="Insurance"
      action={<ShieldCheck className="size-5 text-primary" />}
    />

    <div className="mt-8 text-center text-muted-foreground">

      Insurance information has not been added yet.

    </div>

  </Card>

</TabsContent>

<TabsContent value="security" className="mt-5">

  <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

    <SectionHeading
      title="Security & Privacy"
      action={<Lock className="size-5 text-primary" />}
    />

    <div className="grid gap-4 sm:grid-cols-2 mt-6">

      <Field
        id="current-password"
        label="Current Password"
        value=""
        onChange={() => {}}
        type="password"
      />

      <Field
        id="new-password"
        label="New Password"
        value=""
        onChange={() => {}}
        type="password"
      />

    </div>

    <Button
      className="bg-brand-gradient mt-6 rounded-full font-semibold shadow-glow"
      onClick={() =>
        toast.info("Password change will be available soon.")
      }
    >
      Update Password
    </Button>

  </Card>

</TabsContent>

</Tabs>

</div>

);

}