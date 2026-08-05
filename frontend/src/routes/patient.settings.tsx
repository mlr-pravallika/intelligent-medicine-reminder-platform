import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Accessibility, Bell, Globe, Lock, Moon, Timer } from "lucide-react";
import { toast } from "sonner";

import { SectionHeading } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/patient/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MediCare AI" },
      { name: "description", content: "Notification, reminder, appearance, language, accessibility and privacy settings." },
      { property: "og:title", content: "Settings — MediCare AI" },
      { property: "og:description", content: "Tune MediCare AI to the way you work." },
    ],
  }),
  component: SettingsPage,
});

function ToggleRow({ id, title, desc, defaultChecked = true }: { id: string; title: string; desc: string; defaultChecked?: boolean }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 p-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-bold text-foreground">{title}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} />
    </li>
  );
}

function SettingsPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="space-y-6">
      <SectionHeading title="Settings" description="Control notifications, reminders, appearance, accessibility and privacy." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Notification settings" action={<Bell className="size-5 text-primary" aria-hidden="true" />} />
          <ul className="mt-4 space-y-3">
            <ToggleRow id="set-push" title="Push notifications" desc="Dose reminders and instant alerts" />
            <ToggleRow id="set-sms" title="SMS notifications" desc="Missed dose escalation via text" />
            <ToggleRow id="set-email" title="Email notifications" desc="Weekly reports and refill alerts" defaultChecked={false} />
            <ToggleRow id="set-caregiver" title="Caregiver alerts" desc="Notify caregivers after 2 missed doses" />
          </ul>
        </Card>

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Reminder preferences" action={<Timer className="size-5 text-accent" aria-hidden="true" />} />
          <div className="mt-5 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="snooze">Default snooze duration: 15 minutes</Label>
              <Slider id="snooze" defaultValue={[15]} min={5} max={60} step={5} />
            </div>
            <div className="space-y-3">
              <Label htmlFor="escalate">Escalate after missed doses: 2</Label>
              <Slider id="escalate" defaultValue={[2]} min={1} max={5} step={1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet">Quiet hours</Label>
              <Select defaultValue="23:00 – 06:00">
                <SelectTrigger id="quiet" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Off", "22:00 – 07:00", "23:00 – 06:00", "00:00 – 05:00"].map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Appearance & language" action={<Globe className="size-5 text-primary" aria-hidden="true" />} />
          <ul className="mt-4 space-y-3">
            <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 p-4">
              <div className="min-w-0">
                <Label htmlFor="dark-mode" className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Moon className="size-4" aria-hidden="true" /> Dark mode
                </Label>
                <p className="text-xs text-muted-foreground">Comfortable viewing in low light</p>
              </div>
              <Switch id="dark-mode" checked={dark} onCheckedChange={setDark} />
            </li>
          </ul>
          <div className="mt-4 space-y-2">
            <Label htmlFor="lang">Language</Label>
            <Select defaultValue="English (US)">
              <SelectTrigger id="lang" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["English (US)", "English (UK)", "Español", "Français", "हिन्दी", "العربية"].map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Accessibility" action={<Accessibility className="size-5 text-accent" aria-hidden="true" />} />
          <ul className="mt-4 space-y-3">
            <ToggleRow id="set-contrast" title="High contrast mode" desc="Increase colour contrast across the app" defaultChecked={false} />
            <ToggleRow id="set-motion" title="Reduce motion" desc="Minimise animations and transitions" defaultChecked={false} />
            <ToggleRow id="set-large" title="Large text" desc="Increase base font size for readability" defaultChecked={false} />
            <ToggleRow id="set-voice" title="Voice reminders" desc="Speak reminder text aloud" />
          </ul>
        </Card>

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft lg:col-span-2">
          <SectionHeading title="Privacy & security" action={<Lock className="size-5 text-primary" aria-hidden="true" />} />
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            <ToggleRow id="set-2fa" title="Two-factor authentication" desc="Require OTP on new devices" />
            <ToggleRow id="set-session" title="Auto sign-out" desc="End session after 30 minutes idle" />
            <ToggleRow id="set-share" title="Share reports with caregivers" desc="Weekly adherence summaries" />
            <ToggleRow id="set-analytics" title="Usage analytics" desc="Help improve MediCare AI" defaultChecked={false} />
          </ul>
          <Button className="bg-brand-gradient mt-6 w-fit rounded-full font-semibold shadow-glow" onClick={() => toast.success("Settings updated successfully.")}>
            Save settings
          </Button>
        </Card>
      </div>
    </div>
  );
}

