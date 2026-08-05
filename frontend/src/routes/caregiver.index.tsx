import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, HeartPulse, MessageSquare, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { SectionHeading, StatCard, StatusPill } from "@/components/portal/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { criticalAlerts, patients, weeklyAdherence } from "@/lib/mock-data";

export const Route = createFileRoute("/caregiver/")({
  head: () => ({
    meta: [
      { title: "Caregiver Dashboard — MediCare AI" },
      { name: "description", content: "Monitor assigned patients, adherence, missed doses and critical alerts in real time." },
      { property: "og:title", content: "Caregiver Dashboard — MediCare AI" },
      { property: "og:description", content: "Real-time oversight of every patient you care for." },
    ],
  }),
  component: CaregiverDashboard,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function CaregiverDashboard() {
  const missed = patients.reduce((a, p) => a + p.missedToday, 0);
  const avg = Math.round(patients.reduce((a, p) => a + p.adherence, 0) / patients.length);

  return (
    <div className="space-y-6">
      <SectionHeading title="Caregiver overview" description="Wednesday, 29 July 2026 · 4 patients under your care" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned patients" value={String(patients.length)} tone="primary" icon={<Users className="size-5" />} />
        <StatCard label="Average adherence" value={`${avg}%`} delta="+2.1%" tone="accent" icon={<HeartPulse className="size-5" />} />
        <StatCard label="Missed doses today" value={String(missed)} tone="destructive" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Critical alerts" value={String(criticalAlerts.length)} tone="warning" icon={<AlertTriangle className="size-5" />} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Assigned patients" description="Adherence and last dose status" />
          <ul className="mt-4 space-y-3">
            {patients.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border/70 p-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-primary-soft text-xs font-extrabold text-primary">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{p.name} · {p.age}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.condition} · Last dose {p.lastDose}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <Progress value={p.adherence} className="h-2" />
                  <span className="text-xs font-semibold text-muted-foreground">{p.adherence}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-full font-semibold" onClick={() => toast.success(`Reminder sent to ${p.name}`)}>
                    Send reminder
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full font-semibold" onClick={() => toast(`Opening message thread with ${p.name}`)}>
                    <MessageSquare className="size-4" /> Message
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Critical alerts" />
            <ul className="mt-4 space-y-3">
              {criticalAlerts.map((a) => (
                <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
                    <AlertTriangle className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{a.patient}</p>
                    <p className="text-xs text-muted-foreground">{a.text}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{a.severity} · {a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Weekly adherence" description="Across all assigned patients" />
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAdherence} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="taken" name="Taken" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
