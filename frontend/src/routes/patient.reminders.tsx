import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Smartphone,
  SkipForward,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useRef, useState } from "react";

import { SectionHeading, StatCard, StatusPill } from "@/components/portal/stat-card";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  getCurrentReminders,
  getReminderHistory,
  clearReminderHistory,
  markTaken,
  markMissed,
} from "@/services/reminderService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


export const Route = createFileRoute(
  "/patient/reminders",
)({
  head: () => ({
    meta: [
      {
        title: "Reminder Center — MediCare AI",
      },
      {
        name: "description",
        content:
          "Track today's scheduled, completed, missed and skipped medicine reminders.",
      },
    ],
  }),

  component: RemindersPage,
});


const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};


type ReminderHistory = {
  id: string | number;
  sent_at: string;
  status: string;
  medicine_name?: string;
  dosage?: string;
  reminder_time?: string;
  instructions?: string;
  notification_method?: string;
};


type DoseStatus =
  | "upcoming"
  | "completed"
  | "missed"
  | "skipped";


type ReminderDose = {
  id: string;
  medicineId: number;
  medicine_name: string;
  dosage?: string;
  reminder_time: string;
  instructions?: string;
  status: DoseStatus;
};


const filters = [
  "all",
  "upcoming",
  "completed",
  "missed",
  "skipped",
] as const;


function normalizeStatus(
  value: unknown,
): DoseStatus {
  const status =
    String(value ?? "")
      .trim()
      .toLowerCase();

  if (
    status === "taken" ||
    status === "completed"
  ) {
    return "completed";
  }

  if (status === "missed") {
    return "missed";
  }

  if (status === "skipped") {
    return "skipped";
  }

  return "upcoming";
}


function normalizeTime(
  value: unknown,
): string {
  const text = String(
    value ?? "",
  ).trim();

  const match = text.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i,
  );

  if (!match) {
    return text;
  }

  let hour = Number(
    match[1],
  );

  const minute = match[2];
  const period = match[3]?.toUpperCase();

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  return `${String(
    hour,
  ).padStart(2, "0")}:${minute}`;
}


function splitReminderTimes(
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
      (time) =>
        normalizeTime(time),
    )
    .filter(Boolean);
}


function sameDay(
  value: string | undefined,
  date: Date,
): boolean {
  if (!value) {
    return false;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return false;
  }

  return (
    parsed.getFullYear() ===
      date.getFullYear() &&
    parsed.getMonth() ===
      date.getMonth() &&
    parsed.getDate() ===
      date.getDate()
  );
}


function sameDose(
  historyItem: ReminderHistory,
  dose: {
    medicine_name: string;
    reminder_time: string;
  },
): boolean {
  return (
    String(
      historyItem.medicine_name ?? "",
    )
      .trim()
      .toLowerCase() ===
      dose.medicine_name
        .trim()
        .toLowerCase() &&
    normalizeTime(
      historyItem.reminder_time,
    ) ===
      normalizeTime(
        dose.reminder_time,
      )
  );
}


function latestHistory(
  history: ReminderHistory[],
  dose: {
    medicine_name: string;
    reminder_time: string;
  },
  today: Date,
): ReminderHistory | undefined {
  return history
    .filter(
      (item) =>
        sameDay(
          item.sent_at,
          today,
        ) &&
        sameDose(
          item,
          dose,
        ),
    )
    .sort(
      (a, b) =>
        new Date(
          b.sent_at,
        ).getTime() -
        new Date(
          a.sent_at,
        ).getTime(),
    )[0];
}


function RemindersPage() {
  const [
    history,
    setHistory,
  ] =
    useState<ReminderHistory[]>(
      [],
    );

  const [
    todaysDoses,
    setTodaysDoses,
  ] =
    useState<ReminderDose[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    currentReminder,
    setCurrentReminder,
  ] = useState<any>(null);

  const [
    openReminder,
    setOpenReminder,
  ] = useState(false);

  const [
    weeklyAdherence,
    setWeeklyAdherence,
  ] = useState<any[]>([]);

  // Skipped is intentionally kept as a UI state because the current
  // reminder service does not expose a skip endpoint.
  const [
    skippedDoseIds,
    setSkippedDoseIds,
  ] = useState<string[]>(
    [],
  );

  const notifiedRef =
    useRef<
      string[]
    >([]);


  const loadTodayData =
    async () => {
      const [
        medicines,
        reminderHistory,
      ] =
        await Promise.all([
          getCurrentReminders(),
          getReminderHistory(),
        ]);

      const today =
        new Date();

      const doses: ReminderDose[] =
        [];

      medicines.forEach(
        (medicine: any) => {
          const times =
            splitReminderTimes(
              medicine.reminder_time,
            );

          const usableTimes =
            times.length > 0
              ? times
              : [
                  normalizeTime(
                    medicine.reminder_time,
                  ),
                ].filter(Boolean);

          usableTimes.forEach(
            (
              time,
              timeIndex,
            ) => {
              const uiId = `${medicine.id}-${time}-${timeIndex}`;

              const historyEntry =
                latestHistory(
                  reminderHistory,
                  {
                    medicine_name:
                      String(
                        medicine.medicine_name ??
                          "",
                      ),
                    reminder_time:
                      time,
                  },
                  today,
                );

              let status: DoseStatus =
                historyEntry
                  ? normalizeStatus(
                      historyEntry.status,
                    )
                  : "upcoming";

              if (
                skippedDoseIds.includes(
                  uiId,
                )
              ) {
                status = "skipped";
              }

              doses.push({
                id: uiId,
                medicineId:
                  Number(
                    medicine.id,
                  ),
                medicine_name:
                  String(
                    medicine.medicine_name ??
                      "",
                  ),
                dosage:
                  medicine.dosage,
                reminder_time:
                  time,
                instructions:
                  medicine.instructions,
                status,
              });
            },
          );
        },
      );

      setHistory(
        reminderHistory,
      );

      setTodaysDoses(
        doses,
      );

      const completed =
        doses.filter(
          (dose) =>
            dose.status ===
            "completed",
        ).length;

      const missed =
        doses.filter(
          (dose) =>
            dose.status ===
            "missed",
        ).length;

      const total =
        completed + missed;

      setWeeklyAdherence([
        {
          label: "Today",
          adherence:
            total > 0
              ? Math.round(
                  (completed /
                    total) *
                    100,
                )
              : 0,
          completed,
          missed,
        },
      ]);
    };


  const loadCurrentReminder =
    async () => {
      try {
        const medicines =
          await getCurrentReminders();

        const now =
          new Date();

        const currentTime =
          now.toLocaleTimeString(
            "en-GB",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            },
          );

        const due =
          medicines.find(
            (medicine: any) =>
              splitReminderTimes(
                medicine.reminder_time,
              ).includes(
                currentTime,
              ),
          );

        if (due) {
          setCurrentReminder({
            ...due,
            reminder_time:
              currentTime,
          });

          setOpenReminder(
            true,
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Current reminder error:",
          error,
        );
      }
    };


  const refreshPage =
    async () => {
      await loadTodayData();
      await loadCurrentReminder();
    };


  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          await loadTodayData();
          await loadCurrentReminder();
        } catch (
          error
        ) {
          console.error(
            "Reminder loading error:",
            error,
          );

          toast.error(
            "Unable to load reminder data.",
          );
        } finally {
          setLoading(false);
        }
      };

    void load();

    const interval =
      window.setInterval(
        () => {
          void loadCurrentReminder();
        },
        5000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [skippedDoseIds]);


  useEffect(() => {
    if (
      typeof Notification ===
        "undefined" ||
      Notification.permission !==
        "granted" ||
      !currentReminder
    ) {
      return;
    }

    new Notification(
      "💊 Medicine Reminder",
      {
        body: `${currentReminder.medicine_name}
${currentReminder.dosage}
Time: ${currentReminder.reminder_time}`,
        icon: "/favicon.ico",
      },
    );
  }, [currentReminder]);


  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          const now =
            new Date();

          const currentTime =
            `${String(
              now.getHours(),
            ).padStart(
              2,
              "0",
            )}:${String(
              now.getMinutes(),
            ).padStart(
              2,
              "0",
            )}`;

          todaysDoses.forEach(
            (dose) => {
              if (
                dose.reminder_time ===
                  currentTime &&
                !notifiedRef.current.includes(
                  dose.id,
                ) &&
                dose.status ===
                  "upcoming"
              ) {
                if (
                  typeof Notification !==
                  "undefined"
                ) {
                  const notification =
                    new Notification(
                      "💊 Medicine Reminder",
                      {
                        body:
                          `${dose.medicine_name}\n${dose.dosage ?? ""}`,
                        icon:
                          "/favicon.ico",
                      },
                    );

                  notification.onclick =
                    () =>
                      window.focus();
                }

                notifiedRef.current.push(
                  dose.id,
                );
              }
            },
          );
        },
        5000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [todaysDoses]);


  const handleTaken =
    async (
      dose: ReminderDose,
    ) => {
      try {
        await markTaken(
          dose.medicineId,
        );

        toast.success(
          `${dose.medicine_name} marked as Taken.`,
        );

        await loadTodayData();

      } catch (
        error
      ) {
        console.error(
          "Taken error:",
          error,
        );

        toast.error(
          "Unable to mark the medicine as taken.",
        );
      }
    };


  const handleMissed =
    async (
      dose: ReminderDose,
    ) => {
      try {
        await markMissed(
          dose.medicineId,
        );

        toast.success(
          `${dose.medicine_name} marked as Missed.`,
        );

        await loadTodayData();

      } catch (
        error
      ) {
        console.error(
          "Missed error:",
          error,
        );

        toast.error(
          "Unable to mark the medicine as missed.",
        );
      }
    };


  const handleSkipped =
    (
      dose: ReminderDose,
    ) => {
      setSkippedDoseIds(
        (current) =>
          current.includes(
            dose.id,
          )
            ? current
            : [
                ...current,
                dose.id,
              ],
      );

      toast.success(
        `${dose.medicine_name} reminder skipped.`,
      );
    };


  const clearHistory =
    async () => {
      if (
        !window.confirm(
          "Delete entire reminder history?",
        )
      ) {
        return;
      }

      try {
        await clearReminderHistory();

        toast.success(
          "Reminder history cleared.",
        );

        await loadTodayData();

      } catch (
        error
      ) {
        console.error(
          "Clear history error:",
          error,
        );

        toast.error(
          "Unable to clear reminder history.",
        );
      }
    };


  if (loading) {
    return (
      <div className="p-8 text-center">
        Loading reminder history...
      </div>
    );
  }


  const completedCount =
    todaysDoses.filter(
      (dose) =>
        dose.status ===
        "completed",
    ).length;

  const missedCount =
    todaysDoses.filter(
      (dose) =>
        dose.status ===
        "missed",
    ).length;


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Smart reminder center"
        description="Every scheduled dose, delivery channel and outcome."
      />


      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          label="Reminders today"
          value={String(
            todaysDoses.length,
          )}
          tone="primary"
          icon={
            <Bell className="size-5" />
          }
        />

        <StatCard
          label="Completed"
          value={String(
            completedCount,
          )}
          tone="accent"
          icon={
            <CheckCircle2 className="size-5" />
          }
        />

        <StatCard
          label="Missed"
          value={String(
            missedCount,
          )}
          tone="destructive"
          icon={
            <XCircle className="size-5" />
          }
        />

      </section>


      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Today's timeline"
            description={
              todaysDoses.length
                ? `${todaysDoses.length} reminder(s) scheduled today`
                : "No reminders scheduled for today"
            }
          />


          <Tabs
            defaultValue="all"
            className="mt-4"
          >

            <TabsList className="flex-wrap rounded-full">

              {filters.map(
                (filter) => (
                  <TabsTrigger
                    key={filter}
                    value={filter}
                    className="rounded-full text-xs capitalize"
                  >
                    {filter}
                  </TabsTrigger>
                ),
              )}

            </TabsList>


            {filters.map(
              (filter) => {
                const doses =
                  filter ===
                  "all"
                    ? todaysDoses
                    : todaysDoses.filter(
                        (
                          dose,
                        ) =>
                          dose.status ===
                          filter,
                      );

                return (
                  <TabsContent
                    key={filter}
                    value={filter}
                    className="mt-5"
                  >

                    {doses.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No{" "}
                        {filter ===
                        "all"
                          ? ""
                          : `${filter} `}
                        reminders.
                      </div>
                    )}


                    {doses.map(
                      (dose) => (
                        <Card
                          key={dose.id}
                          className="mb-4 p-4"
                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                              <h3 className="font-semibold">
                                {
                                  dose.medicine_name
                                }
                              </h3>

                              <p className="text-sm text-muted-foreground">
                                {
                                  dose.dosage
                                }
                              </p>

                              <p className="text-sm">
                                Reminder:{" "}
                                <b>
                                  {
                                    dose.reminder_time
                                  }
                                </b>
                              </p>

                              {dose.status ===
                                "completed" && (
                                <p className="mt-1 text-xs font-semibold text-accent">
                                  ✓ Taken today
                                </p>
                              )}

                              {dose.status ===
                                "missed" && (
                                <p className="mt-1 text-xs font-semibold text-destructive">
                                  ✕ Missed today
                                </p>
                              )}

                              {dose.status ===
                                "skipped" && (
                                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                  → Skipped today
                                </p>
                              )}

                            </div>


                            <div className="flex flex-wrap gap-2">

                              {dose.status !==
                                "completed" &&
                                dose.status !==
                                  "missed" &&
                                dose.status !==
                                  "skipped" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      void handleTaken(
                                        dose,
                                      )
                                    }
                                  >
                                    Taken
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      void handleMissed(
                                        dose,
                                      )
                                    }
                                  >
                                    Missed
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleSkipped(
                                        dose,
                                      )
                                    }
                                  >
                                    <SkipForward className="mr-1 size-4" />
                                    Skip
                                  </Button>
                                </>
                              )}

                            </div>

                          </div>

                        </Card>
                      ),
                    )}

                  </TabsContent>
                );
              },
            )}

          </Tabs>

        </Card>


        <div className="space-y-5">

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Reminder preferences"
              description="Choose how you get notified"
            />

            <ul className="mt-4 space-y-3">

              {[
                [
                  Smartphone,
                  "Push notifications",
                  "Instant alerts on your device",
                  true,
                ],
                [
                  MessageSquare,
                  "SMS",
                  "Text alerts for missed doses",
                  true,
                ],
                [
                  Mail,
                  "Email",
                  "Daily summary and refill alerts",
                  false,
                ],
              ].map(
                ([
                  Icon,
                  title,
                  description,
                  enabled,
                ]) => {
                  const IconComponent =
                    Icon as typeof Bell;

                  const id =
                    `pref-${String(
                      title,
                    )
                      .toLowerCase()
                      .replace(
                        /\s/g,
                        "-",
                      )}`;

                  return (
                    <li
                      key={String(
                        title,
                      )}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 p-3"
                    >

                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <IconComponent
                          className="size-4"
                          aria-hidden="true"
                        />
                      </span>

                      <div className="min-w-0">

                        <Label
                          htmlFor={id}
                          className="truncate text-sm font-bold text-foreground"
                        >
                          {String(
                            title,
                          )}
                        </Label>

                        <p className="truncate text-xs text-muted-foreground">
                          {String(
                            description,
                          )}
                        </p>

                      </div>

                      <Switch
                        id={id}
                        defaultChecked={
                          Boolean(
                            enabled,
                          )
                        }
                      />

                    </li>
                  );
                },
              )}

            </ul>

          </Card>


          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

            <SectionHeading
              title="Reminder analytics"
              description="Completed versus missed doses today"
            />

            <div className="mt-4 h-56">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    weeklyAdherence
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
                    dataKey="adherence"
                    name="Success %"
                    fill="var(--chart-2)"
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

          </Card>

        </div>

      </div>


      <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

        <div className="flex items-center justify-between">

          <SectionHeading
            title="Reminder history"
          />

          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              void clearHistory()
            }
          >
            Clear History
          </Button>

        </div>


        <div className="mt-4">

          {history.length === 0 ? (

            <div className="py-10 text-center text-muted-foreground">
              No Reminder History
            </div>

          ) : (

            <div className="space-y-3">

              {history.map(
                (item) => (
                  <Card
                    key={String(
                      item.id,
                    )}
                    className="rounded-xl border p-4 shadow-sm"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-lg font-bold">
                          {
                            item.medicine_name
                          }
                        </p>

                        <p className="text-sm text-muted-foreground">
                          💊{" "}
                          {
                            item.dosage
                          }
                        </p>

                        <p className="text-sm text-muted-foreground">
                          ⏰{" "}
                          {
                            item.reminder_time
                          }
                        </p>

                        <p className="text-sm text-muted-foreground">
                          📅{" "}
                          {new Date(
                            item.sent_at,
                          ).toLocaleString(
                            "en-IN",
                          )}
                        </p>

                      </div>


                      <StatusPill
                        status={
                          normalizeStatus(
                            item.status,
                          ) ===
                          "completed"
                            ? "On track"
                            : normalizeStatus(
                                  item.status,
                                ) ===
                                "missed"
                              ? "At risk"
                              : "Pending"
                        }
                      />

                    </div>

                  </Card>
                ),
              )}

            </div>

          )}

        </div>

      </Card>


      <Dialog
        open={
          openReminder
        }
        onOpenChange={
          setOpenReminder
        }
      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>
              Medicine Reminder
            </DialogTitle>

          </DialogHeader>

          <p>
            Medicine:{" "}
            <b>
              {
                currentReminder?.medicine_name
              }
            </b>
          </p>

          <p>
            Dosage:{" "}
            {
              currentReminder?.dosage
            }
          </p>

          <p>
            Time:{" "}
            {
              currentReminder?.reminder_time
            }
          </p>


          <div className="mt-4 flex gap-2">

            <Button
              onClick={async () => {
                if (
                  !currentReminder
                ) {
                  return;
                }

                await markTaken(
                  currentReminder.id,
                );

                toast.success(
                  "Medicine Taken",
                );

                await refreshPage();

                setOpenReminder(
                  false,
                );
              }}
            >
              Taken
            </Button>

            <Button
              variant="destructive"
              onClick={async () => {
                if (
                  !currentReminder
                ) {
                  return;
                }

                await markMissed(
                  currentReminder.id,
                );

                toast.success(
                  "Medicine marked as Missed",
                );

                await refreshPage();

                setOpenReminder(
                  false,
                );
              }}
            >
              Missed
            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
}
