import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  Activity,
  Bell,
  Bot,
  FileScan,
  Package,
  Pill,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertTriangle,
} from "lucide-react";

import {
  Area,
  Bar,
  AreaChart,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useAuth,
} from "@/hooks/useAuth";

import {
  AxiosError,
} from "axios";

import {
  useEffect,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  getDashboardStats,
  getTodayMedicines,
  getRecentNotifications,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
} from "@/services/dashboardService";

import {
  SectionHeading,
  StatCard,
} from "@/components/portal/stat-card";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


/* ============================================================
   TYPES
============================================================ */

type DashboardStats = {
  total_medicines: number;
  active_medicines: number;
  today_reminders: number;
  expiring_soon: number;
  refill_soon: number;
};


type WeeklyPoint = {
  label: string;
  taken: number;
  missed: number;
};


type MonthlyPoint = {
  label: string;
  adherence: number;
};


/* ============================================================
   ROUTE
============================================================ */

export const Route =
  createFileRoute(
    "/patient/"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Patient Dashboard — MediCare AI",
        },
        {
          name: "description",
          content:
            "Today's medicines, medication reminders, adherence and refill information.",
        },
        {
          property: "og:title",
          content:
            "Patient Dashboard — MediCare AI",
        },
        {
          property: "og:description",
          content:
            "Track medicines, reminders and medication activity in one place.",
        },
      ],
    }),

    component:
      PatientDashboard,
  });


/* ============================================================
   QUICK ACTIONS
============================================================ */

const quickActions = [
  {
    label: "Add Medicine",
    to: "/patient/medicines/add",
    icon: Plus,
  },
  {
    label: "Scan Prescription",
    to: "/patient/ocr",
    icon: FileScan,
  },
  {
    label: "Ask AI Assistant",
    to: "/patient/assistant",
    icon: Bot,
  },
  {
    label: "Refill Forecast",
    to: "/patient/refills",
    icon: Package,
  },
];


/* ============================================================
   CHART TOOLTIP
============================================================ */

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};


/* ============================================================
   HELPERS
============================================================ */

function normalizeWeeklyAnalytics(
  data: unknown
): WeeklyPoint[] {

  if (Array.isArray(data)) {

    return data
      .map((item) => {

        const row =
          item as Record<
            string,
            unknown
          >;

        return {
          label:
            String(
              row.label ??
              row.day ??
              row.date ??
              ""
            ),

          taken:
            Number(
              row.taken ?? 0
            ),

          missed:
            Number(
              row.missed ?? 0
            ),
        };
      })
      .filter(
        (item) =>
          item.label !== ""
      );
  }


  if (
    data &&
    typeof data === "object"
  ) {

    const row =
      data as Record<
        string,
        unknown
      >;


    return [
      {
        label:
          String(
            row.label ??
            row.day ??
            "This week"
          ),

        taken:
          Number(
            row.taken ?? 0
          ),

        missed:
          Number(
            row.missed ?? 0
          ),
      },
    ];
  }


  return [];
}


function normalizeMonthlyAnalytics(
  data: unknown
): MonthlyPoint[] {

  if (Array.isArray(data)) {

    return data
      .map((item) => {

        const row =
          item as Record<
            string,
            unknown
          >;

        const taken =
          Number(
            row.taken ?? 0
          );

        const missed =
          Number(
            row.missed ?? 0
          );

        const calculatedAdherence =
          taken + missed > 0
            ? (
                taken /
                (taken + missed)
              ) * 100
            : 0;

        return {
          label:
            String(
              row.label ??
              row.month ??
              row.date ??
              ""
            ),

          adherence:
            typeof row.adherence ===
            "number"
              ? row.adherence
              : calculatedAdherence,
        };
      })
      .filter(
        (item) =>
          item.label !== ""
      );
  }


  if (
    data &&
    typeof data === "object"
  ) {

    const row =
      data as Record<
        string,
        unknown
      >;

    const taken =
      Number(
        row.taken ?? 0
      );

    const missed =
      Number(
        row.missed ?? 0
      );

    const calculatedAdherence =
      taken + missed > 0
        ? (
            taken /
            (taken + missed)
          ) * 100
        : 0;


    return [
      {
        label:
          String(
            row.label ??
            row.month ??
            "This month"
          ),

        adherence:
          typeof row.adherence ===
          "number"
            ? row.adherence
            : calculatedAdherence,
      },
    ];
  }


  return [];
}


function formatReminderTime(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Time not set";
  }

  return String(value);
}


/* ============================================================
   DASHBOARD
============================================================ */

function PatientDashboard() {

  const {
    user,
  } = useAuth();


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const [
    stats,
    setStats,
  ] = useState<DashboardStats>({
    total_medicines: 0,
    active_medicines: 0,
    today_reminders: 0,
    expiring_soon: 0,
    refill_soon: 0,
  });


  /* ==========================================================
     TODAY'S MEDICINES

     We use the exact type returned by your existing service,
     so this cannot drift from the backend response.
  ========================================================== */

  const [
    todaysMedicines,
    setTodaysMedicines,
  ] = useState<
    Awaited<
      ReturnType<
        typeof getTodayMedicines
      >
    >
  >([]);


  /* ==========================================================
     NOTIFICATIONS

     Again, use the actual service return type.
  ========================================================== */

  const [
    notifications,
    setNotifications,
  ] = useState<
    Awaited<
      ReturnType<
        typeof getRecentNotifications
      >
    >
  >([]);


  /* ==========================================================
     ANALYTICS

     Chart state uses our normalized frontend shape.
  ========================================================== */

  const [
    weeklyAdherence,
    setWeeklyAdherence,
  ] = useState<
    WeeklyPoint[]
  >([]);


  const [
    monthlyAdherence,
    setMonthlyAdherence,
  ] = useState<
    MonthlyPoint[]
  >([]);


  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  const loadDashboard =
    async () => {

      try {

        setLoading(true);
        setError(null);


        const [
          dashboard,
          medicines,
          recentNotifications,
          weekly,
          monthly,
        ] = await Promise.all([
          getDashboardStats(),
          getTodayMedicines(),
          getRecentNotifications(),
          getWeeklyAnalytics(),
          getMonthlyAnalytics(),
        ]);


        /* ----------------------------------------------
           Dashboard stats
        ---------------------------------------------- */

        setStats(
          dashboard
        );


        /* ----------------------------------------------
           Medicines
        ---------------------------------------------- */

        setTodaysMedicines(
          medicines
        );


        /* ----------------------------------------------
           Notifications
        ---------------------------------------------- */

        setNotifications(
          recentNotifications
        );


        /* ----------------------------------------------
           Weekly analytics
        ---------------------------------------------- */

        setWeeklyAdherence(
          normalizeWeeklyAnalytics(
            weekly
          )
        );


        /* ----------------------------------------------
           Monthly analytics
        ---------------------------------------------- */

        setMonthlyAdherence(
          normalizeMonthlyAnalytics(
            monthly
          )
        );

      } catch (error) {

        console.error(
          "Patient dashboard error:",
          error
        );


        const err =
          error as AxiosError<{
            detail?: string;
          }>;


        const message =
          err.response?.data?.detail ||
          "Unable to load your dashboard.";


        setError(
          message
        );


        toast.error(
          message
        );

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadDashboard();

  }, []);


  /* ==========================================================
     GREETING
  ========================================================== */

  const currentHour =
    new Date().getHours();


  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";


  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );


  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {

    return (
      <div className="space-y-6">

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">

          <p className="text-sm font-semibold text-primary">
            👋 {greeting}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back,{" "}
            {user?.name || "Patient"}!
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Loading your medication dashboard...
          </p>

        </section>


        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Total Medicines"
            value="..."
            tone="primary"
            icon={
              <Package className="size-5" />
            }
          />

          <StatCard
            label="Today's Reminders"
            value="..."
            tone="info"
            icon={
              <Bell className="size-5" />
            }
          />

          <StatCard
            label="Refill Soon"
            value="..."
            tone="warning"
            icon={
              <Package className="size-5" />
            }
          />

          <StatCard
            label="Active Medicines"
            value="..."
            tone="accent"
            icon={
              <Activity className="size-5" />
            }
          />

        </section>


        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            <span className="text-sm text-muted-foreground">
              Loading your medication data...
            </span>

          </div>

        </Card>

      </div>
    );
  }


  /* ==========================================================
     ERROR STATE
  ========================================================== */

  if (error) {

    return (
      <div className="space-y-6">

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">

          <p className="text-sm font-semibold text-primary">
            👋 {greeting}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back,{" "}
            {user?.name || "Patient"}!
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your medication workspace is ready.
          </p>

        </section>


        <Card className="border-destructive/30 p-8">

          <div className="text-center">

            <AlertTriangle className="mx-auto size-10 text-destructive" />

            <h2 className="mt-4 text-lg font-bold">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>

            <Button
              className="mt-5"
              onClick={loadDashboard}
            >
              Try again
            </Button>

          </div>

        </Card>

      </div>
    );
  }


  /* ==========================================================
     MAIN DASHBOARD
  ========================================================== */

  return (
    <div className="space-y-6">


      {/* ======================================================
          WELCOME
      ====================================================== */}

      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">

          <div className="min-w-0">

            <p className="text-sm font-semibold text-primary">
              👋 {greeting}
            </p>


            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back,{" "}
              {user?.name || "Patient"}!
            </h1>


            <p className="mt-2 text-sm text-muted-foreground">
              Stay on top of your medicines, reminders
              and refill needs from one place.
            </p>


            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {today}
            </p>


            <div className="mt-5 grid grid-cols-3 gap-3">

              <MiniStat
                value={
                  stats.total_medicines
                }
                label="Medicines"
              />


              <MiniStat
                value={
                  stats.today_reminders
                }
                label="Reminders"
              />


              <MiniStat
                value={
                  stats.refill_soon
                }
                label="Low Stock"
                danger={
                  stats.refill_soon > 0
                }
              />

            </div>


            <p className="mt-3 text-sm text-muted-foreground">

              You have{" "}

              <span className="font-semibold text-foreground">
                {stats.today_reminders}
              </span>{" "}

              reminders scheduled today and{" "}

              <span className="font-semibold text-foreground">
                {stats.refill_soon}
              </span>{" "}

              medicines requiring refill soon.

            </p>

          </div>


          <div className="flex flex-wrap gap-2">

            {quickActions.map(
              (action) => (

                <Button
                  key={action.label}
                  variant="outline"
                  asChild
                  className="rounded-full border-border bg-card font-semibold"
                >

                  <Link to={action.to}>

                    <action.icon className="size-4" />

                    {action.label}

                  </Link>

                </Button>

              )
            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Total Medicines"
          value={String(
            stats.total_medicines
          )}
          tone="primary"
          icon={
            <Package className="size-5" />
          }
        />


        <StatCard
          label="Today's Reminders"
          value={String(
            stats.today_reminders
          )}
          tone="info"
          icon={
            <Bell className="size-5" />
          }
        />


        <StatCard
          label="Refill Soon"
          value={String(
            stats.refill_soon
          )}
          tone={
            stats.refill_soon > 0
              ? "warning"
              : "info"
          }
          icon={
            <Package className="size-5" />
          }
        />


        <StatCard
          label="Active Medicines"
          value={String(
            stats.active_medicines
          )}
          tone="accent"
          icon={
            <Activity className="size-5" />
          }
        />

      </section>


      {/* ======================================================
          TODAY'S MEDICINES + NOTIFICATIONS
      ====================================================== */}

      <section className="grid gap-5 xl:grid-cols-2">


        {/* TODAY'S MEDICINES */}

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Today's medicines"
            description={`${stats.today_reminders} reminders scheduled today`}
          />


          <ul className="mt-4 space-y-3">

            {todaysMedicines.length === 0 ? (

              <li className="rounded-xl border border-dashed border-border py-8 text-center">

                <Pill className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 text-sm font-semibold">
                  No medicines scheduled today
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add a medicine to start receiving reminders.
                </p>

              </li>

            ) : (

              todaysMedicines
                .slice(0, 5)
                .map(
                  (
                    medicine,
                    index
                  ) => {

                    const item =
                      medicine as unknown as Record<
                        string,
                        unknown
                      >;

                    const medicineName =
                      String(
                        item.medicine_name ??
                        item.name ??
                        "Medicine"
                      );

                    const dosage =
                      item.dosage
                        ? String(
                            item.dosage
                          )
                        : null;

                    const reminderTime =
                      formatReminderTime(
                        item.reminder_time ??
                        item.time
                      );

                    const remaining =
                      item.remaining_quantity ??
                      item.remaining;

                    return (
                      <li
                        key={
                          String(
                            item.id ??
                            item.medicine_id ??
                            index
                          )
                        }
                        className="rounded-2xl border border-border/60 bg-background/60 p-4"
                      >

                        <div className="flex items-start gap-3">

                          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">

                            <Pill className="size-4" />

                          </div>


                          <div className="min-w-0 flex-1">

                            <p className="text-sm font-bold">
                              {medicineName}
                            </p>


                            {dosage && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Dosage:{" "}
                                {dosage}
                              </p>
                            )}


                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">

                              <Clock3 className="size-3.5" />

                              {reminderTime}

                            </p>


                            {remaining !==
                              undefined &&
                              remaining !==
                                null && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Remaining:{" "}
                                  {String(
                                    remaining
                                  )}{" "}
                                  tablets
                                </p>
                              )}

                          </div>

                        </div>

                      </li>
                    );
                  }
                )

            )}

          </ul>


          <Button
            variant="outline"
            asChild
            className="mt-4 w-full rounded-full font-semibold"
          >

            <Link to="/patient/medicines">
              View all medicines
            </Link>

          </Button>

        </Card>


        {/* NOTIFICATIONS */}

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Notification panel"
            description={`${unreadNotifications} unread ${
              unreadNotifications === 1
                ? "alert"
                : "alerts"
            }`}
          />


          <ul className="mt-4 space-y-3">

            {notifications.length === 0 ? (

              <li className="rounded-xl border border-dashed border-border py-8 text-center">

                <Bell className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 text-sm font-semibold">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  You're all caught up.
                </p>

              </li>

            ) : (

              notifications
                .slice(0, 5)
                .map(
                  (notification) => (

                    <li
                      key={
                        notification.id
                      }
                      className={`rounded-2xl border p-4 ${
                        notification.is_read
                          ? "border-border/60 bg-background/60"
                          : "border-primary/20 bg-primary/5"
                      }`}
                    >

                      <div className="flex items-start gap-3">

                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">

                          {notification.is_read ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <Bell className="size-4" />
                          )}

                        </div>


                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-bold">
                            {
                              notification.title ??
                              "Notification"
                            }
                          </p>


                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              notification.message ??
                              notification.description??
                              "You have a new notification."
                            }
                          </p>


                          {notification.created_at && (
                            <p className="mt-2 text-[11px] text-muted-foreground">

                              {new Date(
                                notification.created_at
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </p>
                          )}

                        </div>

                      </div>

                    </li>

                  )
                )

            )}

          </ul>


          <Button
            variant="outline"
            asChild
            className="mt-4 w-full rounded-full font-semibold"
          >

            <Link to="/patient/notifications">
              Open notification center
            </Link>

          </Button>

        </Card>

      </section>


      {/* ======================================================
          ANALYTICS
      ====================================================== */}

      <section>

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Adherence analytics"
            description="Medication activity based on your reminder history."
          />


          <Tabs
            defaultValue="weekly"
            className="mt-4"
          >

            <TabsList className="rounded-full">

              <TabsTrigger
                value="weekly"
                className="rounded-full"
              >
                Weekly
              </TabsTrigger>


              <TabsTrigger
                value="monthly"
                className="rounded-full"
              >
                Monthly
              </TabsTrigger>

            </TabsList>


            {/* =================================================
                WEEKLY
            ================================================= */}

            <TabsContent
              value="weekly"
              className="mt-5 h-72"
            >

              {weeklyAdherence.length === 0 ? (

                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No weekly adherence data available yet.
                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      weeklyAdherence
                    }
                    barGap={6}
                  >

                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--border)"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />


                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />


                    <Tooltip
                      contentStyle={
                        tooltipStyle
                      }
                      cursor={{
                        fill:
                          "var(--muted)",
                      }}
                    />


                    <Legend />


                    <Bar
                      dataKey="taken"
                      name="Taken"
                      fill="var(--chart-1)"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />


                    <Bar
                      dataKey="missed"
                      name="Missed"
                      fill="var(--chart-5)"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </TabsContent>


            {/* =================================================
                MONTHLY
            ================================================= */}

            <TabsContent
              value="monthly"
              className="mt-5 h-72"
            >

              {monthlyAdherence.length === 0 ? (

                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No monthly adherence data available yet.
                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={
                      monthlyAdherence
                    }
                  >

                    <defs>

                      <linearGradient
                        id="patientAdherenceFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.35}
                        />

                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />

                      </linearGradient>

                    </defs>


                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--border)"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />


                    <YAxis
                      domain={[
                        0,
                        100,
                      ]}
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />


                    <Tooltip
                      contentStyle={
                        tooltipStyle
                      }
                    />


                    <Area
                      type="monotone"
                      dataKey="adherence"
                      name="Adherence %"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#patientAdherenceFill)"
                    />

                  </AreaChart>

                </ResponsiveContainer>

              )}

            </TabsContent>

          </Tabs>

        </Card>

      </section>


      {/* ======================================================
          QUICK STATUS
      ====================================================== */}

      <section className="grid gap-4 md:grid-cols-3">

        <StatusCard
          icon={
            <CheckCircle2 className="size-5" />
          }
          title="Active medicines"
          value={
            String(
              stats.active_medicines
            )
          }
          description="Currently active medication records."
        />


        <StatusCard
          icon={
            <Package className="size-5" />
          }
          title="Refill attention"
          value={
            String(
              stats.refill_soon
            )
          }
          description={
            stats.refill_soon > 0
              ? "Medicine supplies may need attention soon."
              : "No refill needs reported."
          }
        />


        <StatusCard
          icon={
            <Activity className="size-5" />
          }
          title="Expiring soon"
          value={
            String(
              stats.expiring_soon
            )
          }
          description={
            stats.expiring_soon > 0
              ? "Medication records are approaching their end date."
              : "No medicines are expiring soon."
          }
        />

      </section>

    </div>
  );
}


/* ============================================================
   MINI STAT
============================================================ */

function MiniStat({
  value,
  label,
  danger = false,
}: {
  value: number;
  label: string;
  danger?: boolean;
}) {

  return (
    <div>

      <p
        className={`text-2xl font-bold ${
          danger
            ? "text-red-500"
            : "text-foreground"
        }`}
      >
        {value}
      </p>


      <p className="text-xs text-muted-foreground">
        {label}
      </p>

    </div>
  );
}


/* ============================================================
   STATUS CARD
============================================================ */

function StatusCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {

  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-soft">

      <div className="flex items-start gap-3">

        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">

          {icon}

        </div>


        <div className="min-w-0">

          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-2xl font-extrabold">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>

        </div>

      </div>

    </Card>
  );
}