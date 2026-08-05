import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, Mail, MessageSquare, Smartphone, TimerReset, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState, useRef } from "react";
import { DoseTimeline } from "@/components/portal/dose-timeline";
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
    snoozeReminder
} from "@/services/reminderService";
import {

Dialog,

DialogContent,

DialogHeader,

DialogTitle

} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export const Route = createFileRoute("/patient/reminders")({
  head: () => ({
    meta: [
      { title: "Reminder Center — MediCare AI" },
      { name: "description", content: "Upcoming, completed, missed, skipped and snoozed reminders with analytics." },
      { property: "og:title", content: "Reminder Center — MediCare AI" },
      { property: "og:description", content: "Smart multi-channel medication reminders and history." },
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

function RemindersPage() {
  console.log("✅ Reminders Page Loaded");

  const filters = ["all", "upcoming", "completed", "missed", "skipped", "snoozed"] as const;
  const [history, setHistory] = useState<ReminderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysDoses, setTodaysDoses] = useState<any[]>([]);
  const [currentReminder, setCurrentReminder] = useState<any>(null);
  const notifiedRef = useRef<(string | number)[]>([]);

  const [openReminder, setOpenReminder] = useState(false);

  const [weeklyAdherence, setWeeklyAdherence] = useState<any[]>([]);

  const loadCurrentReminder = async () => {
    try {
      const medicines = await getCurrentReminders();

      const now = new Date();

      const currentTime = now.toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );

      const dueMedicine = medicines.find((m: any) => m.reminder_time === currentTime);

      if (dueMedicine) {
        setCurrentReminder(dueMedicine);
        setOpenReminder(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
    loadCurrentReminder();

    const interval = setInterval(loadCurrentReminder, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    if (Notification.permission === "granted" && currentReminder) {
      new Notification("💊 Medicine Reminder", {
        body: `${currentReminder.medicine_name}
${currentReminder.dosage}
Time : ${currentReminder.reminder_time}`,
        icon: "/favicon.ico",
      });
    }

    

  }, [currentReminder]);

  useEffect(() => {

    const interval = setInterval(() => {

        const now = new Date();

        const currentTime =
            now.getHours().toString().padStart(2, "0")
            + ":" +
            now.getMinutes().toString().padStart(2, "0");

        todaysDoses.forEach((medicine: any) => {

            if (
                medicine.reminder_time === currentTime &&
                !notifiedRef.current.includes(medicine.id)
            ) {

                const notification = new Notification(

                    "💊 Medicine Reminder",

                    {

                        body:
                            `${medicine.medicine_name}\n${medicine.dosage}`,

                        icon: "/favicon.ico"

                    }

                );

                notification.onclick = () => {

                    window.focus();

                };

                notifiedRef.current.push(medicine.id);

            }

        });

    }, 5000);

    return () => clearInterval(interval);

  }, [todaysDoses]);

  const refreshPage = async()=>{

  await loadHistory();

  await loadCurrentReminder();

  }

  const loadHistory = async () => {

    try {

      setLoading(true);

      const reminderHistory = await getReminderHistory();

      const medicines = await getCurrentReminders();

      const mapped = medicines.map((m:any)=>({

        id: m.id,

        medicine_name: m.medicine_name,

        dosage: m.dosage,

        reminder_time: m.reminder_time,

        instructions: m.instructions,

        status: "upcoming"

    }));

      setTodaysDoses(mapped);
      

      const analytics: any[] = [];

      setWeeklyAdherence(analytics);

      setHistory(reminderHistory);

      setWeeklyAdherence(analytics);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

    if (loading) {
      return (
        <div className="p-8 text-center">
          Loading reminder history...
        </div>
      );
    }

  return (
          <div className="space-y-6">
            <SectionHeading title="Smart reminder center" description="Every scheduled dose, delivery channel and outcome." />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Reminders today" value={todaysDoses.length.toString()} tone="primary" icon={<Bell className="size-5" />} />
              <StatCard label="Completed" value={todaysDoses.filter(d => d.status === "completed").length.toString()} tone="accent" icon={<CheckCircle2 className="size-5" />} />
              <StatCard label="Missed" value={todaysDoses.filter(d => d.status === "missed").length.toString()} tone="destructive" icon={<XCircle className="size-5" />} />
              <StatCard label="Snoozed" value={todaysDoses.filter(d => d.status === "snoozed").length.toString()} tone="warning" icon={<TimerReset className="size-5" />} />
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
                <SectionHeading
                  title="Today's timeline"
                  description={todaysDoses.length > 0 ? `${todaysDoses.length} reminder(s) scheduled today` : "No reminders scheduled for today"}
                />
                <Tabs defaultValue="all" className="mt-4">
                  <TabsList className="flex-wrap rounded-full">
                    {filters.map((f) => (
                      <TabsTrigger key={f} value={f} className="rounded-full text-xs capitalize">{f}</TabsTrigger>
                    ))}
                  </TabsList>
                  {filters.map((f) => (
                    <TabsContent key={f} value={f} className="mt-5">
                      {(f === "all" ? todaysDoses : todaysDoses.filter(d => d.status === f)).map((dose: any) => (
                        <Card key={dose.id} className="mb-4 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{dose.medicine_name}</h3>
                              <p className="text-sm text-muted-foreground">{dose.dosage}</p>
                              <p className="text-sm">Reminder : <b>{dose.reminder_time}</b></p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={async () => { console.log("Reminder ID:", dose.id); await markTaken(dose.id); toast.success("Medicine marked as Taken"); await refreshPage(); }}>Taken</Button>
                              <Button size="sm" variant="destructive" onClick={async () => { await markMissed(dose.id); await loadHistory(); await loadCurrentReminder(); toast.success("Medicine marked as Missed"); await refreshPage(); }}>Missed</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>

              <div className="space-y-5">
                <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
                  <SectionHeading title="Reminder preferences" description="Choose how you get notified" />
                  <ul className="mt-4 space-y-3">
                    {[
                      [Smartphone, "Push notifications", "Instant alerts on your device", true],
                      [MessageSquare, "SMS", "Text alerts for missed doses", true],
                      [Mail, "Email", "Daily summary and refill alerts", false],
                    ].map(([Icon, title, desc, on]) => {
                      const I = Icon as typeof Bell;
                      const id = `pref-${(title as string).toLowerCase().replace(/\s/g, "-")}`;
                      return (
                        <li key={title as string} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 p-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><I className="size-4" aria-hidden="true" /></span>
                          <div className="min-w-0">
                            <Label htmlFor={id} className="truncate text-sm font-bold text-foreground">{title as string}</Label>
                            <p className="truncate text-xs text-muted-foreground">{desc as string}</p>
                          </div>
                          <Switch id={id} defaultChecked={on as boolean} />
                        </li>
                      );
                    })}
                  </ul>
                </Card>

                <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
                  <SectionHeading title="Reminder analytics" description="Deliveries versus misses" />
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyAdherence}>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                        <Bar dataKey="adherence" name="Success %" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
              <div className="flex items-center justify-between">

                <SectionHeading title="Reminder history" />

                <Button
                  variant="destructive"
                  size="sm"

                  onClick={async () => {

                    if(confirm("Delete entire reminder history?")){

                    await clearReminderHistory();

                    toast.success("History Cleared");

                    loadHistory();

                    }

                  }}
                >
                  Clear History
                </Button>

              </div>
              <div className="mt-4 overflow-x-auto">
                {history.length === 0 ? (

                  <div className="text-center py-10 text-gray-500">
                    No Reminder History
                  </div>

                ) : (

                <div className="space-y-3">

                {history.map((item:any)=>(

                <Card
                key={item.id}
                className="border rounded-xl p-4 shadow-sm">

                <div className="flex justify-between items-center">

                <div>

                <p className="font-bold text-lg">

                {item.medicine_name}

                </p>

                <p className="text-sm text-gray-500">

                💊 {item.dosage}

                </p>

                <p className="text-sm text-gray-500">

                ⏰ {item.reminder_time}

                </p>

                <p className="text-sm text-gray-500">

                📅 {new Date(item.sent_at).toLocaleString("en-IN")}

                </p>

                </div>

                <div>

                <StatusPill

                status={
                item.status==="Taken"
                ?"On track"
                :item.status==="Missed"
                ?"At risk"
                :"Pending"
                }

                />

                </div>

                </div>

                </Card>

                ))}

                </div>
                )} 
              </div>
            </Card>

            <Dialog open={openReminder} onOpenChange={setOpenReminder}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Medicine Reminder</DialogTitle>
                </DialogHeader>

                <p>Medicine: <b>{currentReminder?.medicine_name}</b></p>
                <p>Dosage: {currentReminder?.dosage}</p>
                <p>Time: {currentReminder?.reminder_time}</p>

                <div className="mt-4 flex gap-2">
                  <Button onClick={async () => { if (!currentReminder) return; await markTaken(currentReminder.id); await loadHistory(); await loadCurrentReminder(); toast.success("Medicine Taken"); setOpenReminder(false); }}>Taken</Button>
                  <Button variant="outline" onClick={async () => { if (!currentReminder) return; await snoozeReminder(currentReminder.id); await loadHistory(); await loadCurrentReminder(); toast.success("Reminder Snoozed"); await refreshPage(); setOpenReminder(false); }}>Snooze</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}   
