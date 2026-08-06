import { createFileRoute } from "@tanstack/react-router";
import { Activity, FileScan, ServerCog, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { SectionHeading, StatCard, StatusPill } from "@/components/portal/stat-card";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Pill } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — MediCare AI" },
      { name: "description", content: "Platform analytics, user management, OCR accuracy, AI usage, system health and audit logs." },
      { property: "og:title", content: "Admin Dashboard — MediCare AI" },
      { property: "og:description", content: "Enterprise oversight for the MediCare AI platform." },
    ],
  }),
  component: AdminDashboard,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const tones = ["primary", "accent", "info", "warning"] as const;
const icons = [Users, Activity, Users, ServerCog];

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <SectionHeading
      title="Admin Dashboard"
      description="Manage users, medicines, reminders and OCR prescriptions."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <StatCard
      label="Registered Users"
      value="--"
      icon={<Users className="size-5"/>}
      />

      <StatCard
      label="Medicines"
      value="--"
      icon={<Pill className="size-5"/>}
      />

      <StatCard
      label="OCR Prescriptions"
      value="--"
      icon={<FileScan className="size-5"/>}
      />

      <StatCard
      label="Notifications"
      value="--"
      icon={<Bell className="size-5"/>}
      />

      </section>

      <div className="grid gap-5 xl:grid-cols-2">

      <Card className="p-6">

      <SectionHeading
      title="Administrator Controls"
      />

      <ul className="mt-4 space-y-3">

      <li>✅ Manage Users</li>

      <li>✅ Manage Medicines</li>

      <li>✅ View OCR Prescriptions</li>

      <li>✅ Monitor Reminders</li>

      <li>✅ Review Notifications</li>

      </ul>

      </Card>

      <Card className="p-6">

      <SectionHeading
      title="Platform Information"
      />

      <ul className="mt-4 space-y-3">

      <li>Frontend : React + TypeScript</li>

      <li>Backend : FastAPI</li>

      <li>Database : SQLite</li>

      <li>AI OCR : Gemini 2.5 Flash</li>

      <li>OCR Engine : EasyOCR</li>

      </ul>

      </Card>

      </div>

      <Card className="gap-0 overflow-x-auto rounded-2xl border-border/70 p-6 shadow-soft">
        <SectionHeading title="Audit logs" description="Security and activity trail" />
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </Card>
    </div>
  );
}
