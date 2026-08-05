import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Pill, Clock, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/portal/stat-card";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { getTodayMedicines } from "@/services/calendarService";

export const Route = createFileRoute("/patient/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [todaysDoses, setTodaysDoses] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const loadCalendar = async () => {
    try {
      const data = await getTodayMedicines();
      setTodaysDoses(data);
    } catch (err) {
      toast.error("Unable to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <SectionHeading
        title="Medication Calendar"
        description="View today's medication schedule."
        action={
          <Button variant="outline" onClick={loadCalendar}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">

        <Card className="rounded-2xl p-5 shadow-soft">

          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-xl"
          />

        </Card>

        <Card className="rounded-2xl p-6 shadow-soft">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Today's Medicines
              </h2>

              <p className="text-sm text-muted-foreground">
                {new Date().toDateString()}
              </p>

            </div>

            <Badge variant="secondary">

              {todaysDoses.length} Medicines

            </Badge>

          </div>

          <div className="mt-6 space-y-4">

            {todaysDoses.length === 0 ? (

              <div className="rounded-xl border border-dashed p-12 text-center">

                <CalendarIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

                <h3 className="font-semibold">
                  No medicines scheduled
                </h3>

                <p className="text-sm text-muted-foreground">
                  Enjoy your day.
                </p>

              </div>

            ) : (

              todaysDoses.map((medicine: any) => (

                <Card
                  key={medicine.id}
                  className="rounded-xl border p-5 transition hover:shadow-md"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <Pill className="h-5 w-5 text-primary" />

                        <h3 className="font-semibold">

                          {medicine.medicine_name}

                        </h3>

                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">

                        {medicine.dosage}

                      </p>

                      <div className="mt-3 flex items-center gap-2 text-sm">

                        <Clock className="h-4 w-4" />

                        {medicine.reminder_time}

                      </div>

                    </div>

                    <Badge>

                      {medicine.frequency}

                    </Badge>

                  </div>

                </Card>

              ))

            )}

          </div>

        </Card>

      </div>

    </div>
  );
}