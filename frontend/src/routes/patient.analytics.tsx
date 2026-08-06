import { createFileRoute } from "@tanstack/react-router";
import { Activity, BarChart3, Pill, PieChart as PieIcon, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/medicineService";

import { SectionHeading, StatCard } from "@/components/portal/stat-card";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  consumptionTrend,
  doseBreakdown,
  monthlyAdherence,
  weeklyAdherence,
  yearlyAdherence,
} from "@/lib/mock-data";

export const Route = createFileRoute("/patient/analytics")({
  head: () => ({
    meta: [
      { title: "Medication Analytics — MediCare AI" },
      { name: "description", content: "Daily, weekly, monthly and yearly adherence, consumption and health score analytics." },
      { property: "og:title", content: "Medication Analytics — MediCare AI" },
      { property: "og:description", content: "Interactive medication adherence and consumption charts." },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const pieColors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-5)", "var(--chart-4)"];

const dailyData = [
  { label: "06:00", doses: 1 },
  { label: "09:00", doses: 2 },
  { label: "12:00", doses: 0 },
  { label: "15:00", doses: 1 },
  { label: "18:00", doses: 1 },
  { label: "21:00", doses: 2 },
];

function AnalyticsPage() {
  const [stats, setStats] = useState({
    total_medicines: 0,
    active_medicines: 0,
    today_reminders: 0,
    expiring_soon: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardStats();
        console.log(JSON.stringify(data, null, 2));
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        Loading dashboard...
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <SectionHeading title="Medication analytics" description="Understand adherence, consumption and reminder performance over time." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Medicines"
          value={String(stats.total_medicines ?? 0)}
          icon={<Pill className="size-5" />}
        />

        <StatCard
          label="Active Medicines"
          value={String(stats.active_medicines ?? 0)}
          icon={<Activity className="size-5" />}
        />

        <StatCard
          label="Today's Reminders"
          value={String(stats.today_reminders ?? 0)}
          icon={<BarChart3 className="size-5" />}
        />

        <StatCard
          label="Expiring Soon"
          value={String(stats.expiring_soon ?? 0)}
          tone="destructive"
          icon={<PieIcon className="size-5" />}
        />
      </section>

      <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
        <SectionHeading title="Adherence over time" description="Switch the reporting period" />
        <Tabs defaultValue="weekly" className="mt-4">
          <TabsList className="rounded-full">
            {["daily", "weekly", "monthly", "yearly"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-full capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="daily" className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="doses" name="Doses" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="weekly" className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAdherence} barGap={6}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="taken" name="Taken" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="missed" name="Missed" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="monthly" className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAdherence}>
                <defs>
                  <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[60, 100]} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="adherence" name="Adherence %" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#monthFill)" />
                <Area type="monotone" dataKey="reminders" name="Reminder success %" stroke="var(--chart-2)" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="yearly" className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyAdherence}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[60, 100]} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="adherence" name="Adherence %" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Dose outcome breakdown" description="Last 30 days" />
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={doseBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {doseBreakdown.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Medicine consumption" description="Units consumed per month" />
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionTrend}>
                <defs>
                  <linearGradient id="consumptionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="units" name="Units" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#consumptionFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
