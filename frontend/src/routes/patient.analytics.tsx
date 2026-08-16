import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Pill,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEffect, useMemo, useState } from "react";

import {
  getDashboardStats,
  getMedicines,
} from "@/services/medicineService";

import {
  getReminderHistory,
  getCurrentReminders,
} from "@/services/reminderService";

import {
  SectionHeading,
  StatCard,
} from "@/components/portal/stat-card";

import { Card } from "@/components/ui/card";

export const Route = createFileRoute(
  "/patient/analytics",
)({
  head: () => ({
    meta: [
      {
        title: "Medication Analytics — MediCare AI",
      },
      {
        name: "description",
        content:
          "Real medication, reminder, adherence and consumption analytics.",
      },
      {
        property: "og:title",
        content:
          "Medication Analytics — MediCare AI",
      },
      {
        property: "og:description",
        content:
          "Real medication adherence and consumption analytics.",
      },
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


const pieColors = [
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--chart-1)",
];


type HistoryItem = {
  id: string | number;
  medicine_name?: string;
  dosage?: string;
  reminder_time?: string;
  sent_at: string;
  status: string;
};


type MedicineItem = {
  id: number;
  medicine_name: string;
  total_quantity?: number;
  remaining_quantity?: number;
  tablets_per_day?: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  reminder_time?: string;
};


function normalizeStatus(
  value: unknown,
): "taken" | "missed" | "other" {
  const status =
    String(value ?? "")
      .trim()
      .toLowerCase();

  if (
    status === "taken" ||
    status === "completed"
  ) {
    return "taken";
  }

  if (status === "missed") {
    return "missed";
  }

  return "other";
}


function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}


function sameDay(
  left: Date,
  right: Date,
) {
  return (
    left.getFullYear() ===
      right.getFullYear() &&
    left.getMonth() ===
      right.getMonth() &&
    left.getDate() ===
      right.getDate()
  );
}


function formatDay(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    },
  );
}


function formatMonth(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-IN",
    {
      month: "short",
    },
  );
}


function splitTimes(
  value: unknown,
): string[] {
  const text = String(
    value ?? "",
  ).trim();

  if (!text) {
    return [];
  }

  return text
    .split(",")
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean);
}


function buildDailyReminderData(
  medicines: MedicineItem[],
) {
  const timeMap =
    new Map<
      string,
      number
    >();

  medicines.forEach(
    (medicine) => {
      splitTimes(
        medicine.reminder_time,
      ).forEach(
        (time) => {
          timeMap.set(
            time,
            (timeMap.get(time) ??
              0) + 1,
          );
        },
      );
    },
  );

  return Array.from(
    timeMap.entries(),
  )
    .sort(
      ([a], [b]) =>
        a.localeCompare(b),
    )
    .map(
      ([label, doses]) => ({
        label,
        doses,
      }),
    );
}


function buildWeeklyAdherenceData(
  history: HistoryItem[],
) {
  const today =
    startOfDay(
      new Date(),
    );

  const result = [];

  for (
    let offset = 6;
    offset >= 0;
    offset -= 1
  ) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() -
        offset,
    );

    let taken = 0;
    let missed = 0;

    history.forEach(
      (item) => {
        const sentAt =
          new Date(
            item.sent_at,
          );

        if (
          sameDay(
            sentAt,
            date,
          )
        ) {
          const status =
            normalizeStatus(
              item.status,
            );

          if (
            status === "taken"
          ) {
            taken += 1;
          }

          if (
            status === "missed"
          ) {
            missed += 1;
          }
        }
      },
    );

    result.push({
      label:
        date.toLocaleDateString(
          "en-IN",
          {
            weekday: "short",
          },
        ),
      taken,
      missed,
      adherence:
        taken + missed > 0
          ? Math.round(
              (taken /
                (taken +
                  missed)) *
                100,
            )
          : 0,
    });
  }

  return result;
}


function buildMonthlyAdherenceData(
  history: HistoryItem[],
) {
  const today =
    startOfDay(
      new Date(),
    );

  const result = [];

  for (
    let offset = 29;
    offset >= 0;
    offset -= 1
  ) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() -
        offset,
    );

    let taken = 0;
    let missed = 0;

    history.forEach(
      (item) => {
        const sentAt =
          new Date(
            item.sent_at,
          );

        if (
          sameDay(
            sentAt,
            date,
          )
        ) {
          const status =
            normalizeStatus(
              item.status,
            );

          if (
            status === "taken"
          ) {
            taken += 1;
          }

          if (
            status === "missed"
          ) {
            missed += 1;
          }
        }
      },
    );

    const label =
      date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        },
      );

    result.push({
      label,
      adherence:
        taken + missed > 0
          ? Math.round(
              (taken /
                (taken +
                  missed)) *
                100,
            )
          : 0,
      taken,
      missed,
    });
  }

  return result;
}


function buildOutcomeData(
  history: HistoryItem[],
) {
  const taken =
    history.filter(
      (item) =>
        normalizeStatus(
          item.status,
        ) === "taken",
    ).length;

  const missed =
    history.filter(
      (item) =>
        normalizeStatus(
          item.status,
        ) === "missed",
    ).length;

  const other =
    history.filter(
      (item) =>
        normalizeStatus(
          item.status,
        ) === "other",
    ).length;

  const result = [];

  if (taken > 0) {
    result.push({
      name: "Taken",
      value: taken,
    });
  }

  if (missed > 0) {
    result.push({
      name: "Missed",
      value: missed,
    });
  }

  if (other > 0) {
    result.push({
      name: "Other",
      value: other,
    });
  }

  return result.length > 0
    ? result
    : [
        {
          name: "No history",
          value: 1,
        },
      ];
}


function buildConsumptionData(
  medicines: MedicineItem[],
) {
  return medicines
    .map(
      (medicine) => {
        const total =
          Number(
            medicine.total_quantity ??
              0,
          );

        const remaining =
          Number(
            medicine.remaining_quantity ??
              0,
          );

        const consumed =
          Math.max(
            0,
            total -
              remaining,
          );

        return {
          label:
            medicine.medicine_name,
          units: consumed,
        };
      },
    )
    .filter(
      (item) =>
        item.units > 0,
    )
    .sort(
      (a, b) =>
        b.units - a.units,
    )
    .slice(0, 8);
}


function AnalyticsPage() {
  const [
    stats,
    setStats,
  ] = useState({
    total_medicines: 0,
    active_medicines: 0,
    today_reminders: 0,
    expiring_soon: 0,
  });

  const [
    medicines,
    setMedicines,
  ] = useState<
    MedicineItem[]
  >([]);

  const [
    history,
    setHistory,
  ] = useState<
    HistoryItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    const loadAnalytics =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            dashboardStats,
            medicineList,
            reminderHistory,
          ] =
            await Promise.all([
              getDashboardStats(),
              getMedicines(),
              getReminderHistory(),
            ]);

          // Verify the reminder endpoint is reachable as part of the
          // real-data analytics refresh. The returned list is not mocked.
          await getCurrentReminders();

          setStats({
            total_medicines:
              Number(
                dashboardStats?.total_medicines ??
                  0,
              ),
            active_medicines:
              Number(
                dashboardStats?.active_medicines ??
                  0,
              ),
            today_reminders:
              Number(
                dashboardStats?.today_reminders ??
                  0,
              ),
            expiring_soon:
              Number(
                dashboardStats?.expiring_soon ??
                  0,
              ),
          });

          setMedicines(
            Array.isArray(
              medicineList,
            )
              ? medicineList
              : [],
          );

          setHistory(
            Array.isArray(
              reminderHistory,
            )
              ? reminderHistory
              : [],
          );
        } catch (
          loadError
        ) {
          console.error(
            "Analytics loading error:",
            loadError,
          );

          setError(
            "Unable to load live analytics right now.",
          );
        } finally {
          setLoading(false);
        }
      };

    void loadAnalytics();
  }, []);


  const dailyData =
    useMemo(
      () =>
        buildDailyReminderData(
          medicines,
        ),
      [medicines],
    );

  const weeklyData =
    useMemo(
      () =>
        buildWeeklyAdherenceData(
          history,
        ),
      [history],
    );

  const monthlyData =
    useMemo(
      () =>
        buildMonthlyAdherenceData(
          history,
        ),
      [history],
    );

  const outcomeData =
    useMemo(
      () =>
        buildOutcomeData(
          history,
        ),
      [history],
    );

  const consumptionData =
    useMemo(
      () =>
        buildConsumptionData(
          medicines,
        ),
      [medicines],
    );

  const takenCount =
    history.filter(
      (item) =>
        normalizeStatus(
          item.status,
        ) === "taken",
    ).length;

  const missedCount =
    history.filter(
      (item) =>
        normalizeStatus(
          item.status,
        ) === "missed",
    ).length;

  const overallAdherence =
    takenCount +
      missedCount >
    0
      ? Math.round(
          (takenCount /
            (takenCount +
              missedCount)) *
            100,
        )
      : 0;

  const consumedUnits =
    medicines.reduce(
      (total, medicine) =>
        total +
        Math.max(
          0,
          Number(
            medicine.total_quantity ??
              0,
          ) -
            Number(
              medicine.remaining_quantity ??
                0,
            ),
        ),
      0,
    );


  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        Loading live medication analytics...
      </div>
    );
  }


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Medication analytics"
        description="Live medication, reminder, adherence and consumption data from your account."
      />


      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}


      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <StatCard
          label="Total Medicines"
          value={String(
            stats.total_medicines,
          )}
          icon={
            <Pill className="size-5" />
          }
        />

        <StatCard
          label="Active Medicines"
          value={String(
            stats.active_medicines,
          )}
          icon={
            <Activity className="size-5" />
          }
        />

        <StatCard
          label="Today's Reminders"
          value={String(
            stats.today_reminders,
          )}
          icon={
            <BarChart3 className="size-5" />
          }
        />

        <StatCard
          label="Overall Adherence"
          value={`${overallAdherence}%`}
          icon={
            <TrendingUp className="size-5" />
          }
        />

        <StatCard
          label="Expiring Soon"
          value={String(
            stats.expiring_soon,
          )}
          tone="destructive"
          icon={
            <XCircle className="size-5" />
          }
        />

      </section>


      <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="Adherence over time"
          description="Calculated from your stored Taken and Missed reminder history. No yearly report is shown."
        />

        <div className="mt-6 space-y-6">

          <div>
            <p className="mb-3 text-sm font-semibold">
              Last 7 days
            </p>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={weeklyData}
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
                    allowDecimals={false}
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

                  <Legend
                    wrapperStyle={{
                      fontSize: 12,
                    }}
                  />

                  <Bar
                    dataKey="taken"
                    name="Taken"
                    fill="var(--chart-2)"
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

            </div>
          </div>


          <div>
            <p className="mb-3 text-sm font-semibold">
              Last 30 days
            </p>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart
                  data={
                    monthlyData
                  }
                >

                  <defs>
                    <linearGradient
                      id="liveAdherenceFill"
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
                    interval="preserveStartEnd"
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
                    fill="url(#liveAdherenceFill)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>
          </div>

        </div>

      </Card>


      <div className="grid gap-5 lg:grid-cols-2">

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Reminder outcomes"
            description="All stored reminder outcomes"
          />

          <div className="mt-4 h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >

                  {outcomeData.map(
                    (entry, index) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          pieColors[
                            index %
                              pieColors.length
                          ]
                        }
                      />
                    ),
                  )}

                </Pie>

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                />

                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

          </div>


          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-accent/10 p-3">

              <p className="text-xs text-muted-foreground">
                Taken
              </p>

              <p className="mt-1 text-2xl font-bold">
                {takenCount}
              </p>

            </div>


            <div className="rounded-xl bg-destructive/10 p-3">

              <p className="text-xs text-muted-foreground">
                Missed
              </p>

              <p className="mt-1 text-2xl font-bold">
                {missedCount}
              </p>

            </div>

          </div>

        </Card>


        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Medicine consumption"
            description="Calculated from quantity in hand versus original quantity"
          />

          <div className="mt-4 h-72">

            {consumptionData.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    consumptionData
                  }
                  layout="vertical"
                >

                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="var(--border)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
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

                  <Bar
                    dataKey="units"
                    name="Units consumed"
                    fill="var(--chart-2)"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No medicine consumption recorded yet.
              </div>
            )}

          </div>


          <div className="mt-4 rounded-xl bg-primary-soft p-4">

            <p className="text-xs text-muted-foreground">
              Total units consumed
            </p>

            <p className="mt-1 text-2xl font-bold">
              {consumedUnits}
            </p>

          </div>

        </Card>

      </div>


      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <SectionHeading
          title="Today's reminder schedule"
          description="Real reminder times currently configured for your medicines."
        />

        <div className="mt-4 h-64">

          {dailyData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  dailyData
                }
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
                  allowDecimals={false}
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

                <Bar
                  dataKey="doses"
                  name="Scheduled doses"
                  fill="var(--chart-1)"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No reminder times configured.
            </div>
          )}

        </div>

      </Card>

    </div>
  );
}
