import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Bot,
  FileScan,
  Package,
  Pill,
  Plus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/hooks/useAuth";

import {
    getDashboardStats,
    getTodayMedicines,
    getRecentNotifications,
    getWeeklyAnalytics,
    getMonthlyAnalytics,
    getRecentActivity,
} from "@/services/dashboardService";

import { DoseTimeline } from "@/components/portal/dose-timeline";
import { SectionHeading, StatCard, StatusPill } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEffect, useState } from "react";


export const Route = createFileRoute("/patient/")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard — MediCare AI" },
      { name: "description", content: "Today's medicines, reminder timeline, adherence score and AI health insights." },
      { property: "og:title", content: "Patient Dashboard — MediCare AI" },
      { property: "og:description", content: "Track doses, adherence and AI recommendations in one place." },
    ],
  }),
  component: PatientDashboard,
});

const quickActions = [
  { label: "Add Medicine", to: "/patient/medicines/add", icon: Plus },
  { label: "Scan Prescription", to: "/patient/ocr", icon: FileScan },
  { label: "Ask AI Assistant", to: "/patient/assistant", icon: Bot },
  { label: "Refill Forecast", to: "/patient/refills", icon: Package },
];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function PatientDashboard() {

    const { user } = useAuth();

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({

      total_medicines: 0,

      active_medicines: 0,

      today_reminders: 0,

      expiring_soon: 0,

      refill_soon: 0,

    });

    const [todaysDoses, setTodaysDoses] = useState<any[]>([]);

    const [medicines, setMedicines] = useState<any[]>([]);

    const [notifications, setNotifications] = useState<any[]>([]);

    const [weeklyAdherence, setWeeklyAdherence] = useState<any>([]);

    const [monthlyAdherence, setMonthlyAdherence] = useState<any>([]);

    const [activity, setActivity] = useState<any[]>([]);

    const loadDashboard = async () => {

      try {

        setLoading(true);

        const dashboard = await getDashboardStats();

        setStats(dashboard);

        const doses = await getTodayMedicines();

        setTodaysDoses(doses);

        setMedicines(doses);

        const notify = await getRecentNotifications();

        setNotifications(notify);

        const weekly = await getWeeklyAnalytics();

        setWeeklyAdherence(weekly);

        const monthly = await getMonthlyAnalytics();

        setMonthlyAdherence(monthly);

        const recent = await getRecentActivity();

        setActivity(recent);

      }

      catch (err) {

        console.error(err);

      }

      finally {

        setLoading(false);

      }

    };

    useEffect(() => {

      loadDashboard();

    }, []);

    const completed = todaysDoses.filter(

      (d) => d.status === "completed"

    );

    const missed = todaysDoses.filter(

      (d) => d.status === "missed"

    );

    const hour = new Date().getHours();

    const greeting =
      hour < 12
        ? "Good Morning"
        : hour < 17
        ? "Good Afternoon"
        : "Good Evening";  

  return (
    <div className="space-y-6">
      <section className="glass-panel animate-rise grid grid-cols-1 gap-5 rounded-3xl p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            👋 {greeting}
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Welcome back, {user?.name}
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">

            <div>
              <p className="text-2xl font-bold">
                {stats.total_medicines}
              </p>
              <p className="text-muted-foreground">
                Medicines
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">
                {stats.today_reminders}
              </p>
              <p className="text-muted-foreground">
                Reminders
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-red-500">
                {stats.refill_soon}
              </p>
              <p className="text-muted-foreground">
                Low Stock
              </p>
            </div>

          </div>
          <p className="text-muted-foreground mt-2">

          You have {stats.today_reminders} reminders scheduled today and {stats.refill_soon} medicines requiring refill soon.

          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Button key={a.label} variant="outline" asChild className="rounded-full border-border bg-card font-semibold">
              <Link to={a.to}>
                <a.icon className="size-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard

        label="Total Medicines"

        value={stats.total_medicines.toString()}

        tone="primary"

        icon={<Package className="size-5" />}
        />
        <StatCard

        label="Today's Reminders"

        value={stats.today_reminders.toString()}

        tone="info"

        icon={<Bell className="size-5"/>}
        />
        <StatCard

        label="Refill Soon"

        value={stats.refill_soon.toString()}

        tone="info"

        icon={<Package className="size-5"/>}
        />
        <StatCard

        label="Active Medicines"

        value={stats.active_medicines.toString()}

        tone="accent"

        icon={<Activity className="size-5"/>}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading
            title="Today's reminder timeline"
            description={new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <DoseTimeline doses={todaysDoses} />
        </Card>

        <div className="space-y-5">
          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">

            Today's scheduled medicines

            </p>
            <ul className="mt-4 space-y-3">
              {medicines.length === 0 ? (
                <li className="py-8 text-center text-muted-foreground">
                  No medicines added yet.
                </li>
              ) : (
                medicines.slice(0, 4).map((m, index) => (
                  <li
                    key={m.id ?? m.medicine_id ?? m.name ?? index}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-4"
                  >
                    <Pill className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {m.name ?? m.medicine_name ?? "Medicine"}
                      </p>
                      <p className="text-sm">

                      💊 Dosage:
                      {m.dosage}

                      </p>

                      <p className="text-sm">

                      🕒 Reminder:
                      {m.reminder_time}

                      </p>

                      <p className="text-sm">

                      📦 Remaining:
                      {m.remaining_quantity} tablets

                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <Button variant="outline" asChild className="mt-4 w-full rounded-full font-semibold">
              <Link to="/patient/medicines">View all medicines</Link>
            </Button>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Notification panel" description={`${notifications.filter(n => !n.is_read).length} unread alerts`} />
            <ul className="mt-4 space-y-3">
              {notifications.length === 0 ? (
                <li className="py-8 text-center text-muted-foreground">
                  No notifications available.
                </li>
              ) : (
                notifications.slice(0, 3).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-4">
                    <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title ?? "Notification"}</p>
                      <p className="text-sm text-muted-foreground">{n.message ?? n.description ?? "You have a new alert."}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <Button variant="outline" asChild className="mt-4 w-full rounded-full font-semibold">
              <Link to="/patient/notifications">Open notification center</Link>
            </Button>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Adherence analytics" description="Doses taken versus missed" />
          <Tabs defaultValue="weekly" className="mt-4">
            <TabsList className="rounded-full">
              <TabsTrigger value="weekly" className="rounded-full">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-full">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly" className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAdherence} barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="taken" name="Taken" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="monthly" className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAdherence}>
                  <defs>
                    <linearGradient id="adherenceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis domain={[60, 100]} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="adherence" name="Adherence %" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#adherenceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>
      </section>

    </div>
  );
}

