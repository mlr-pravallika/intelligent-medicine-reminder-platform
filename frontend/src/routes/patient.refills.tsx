import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Package, Sparkles } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { SectionHeading, StatCard, StatusPill } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getRefillStatus } from "@/services/refillService";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/patient/refills")({
  head: () => ({
    meta: [
      { title: "AI Refill Prediction — MediCare AI" },
      { name: "description", content: "Remaining stock, days left, predicted refill dates and low-stock warnings." },
      { property: "og:title", content: "AI Refill Prediction — MediCare AI" },
      { property: "og:description", content: "Forecast medicine run-out dates before you run out." },
    ],
  }),
  component: RefillsPage,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function RefillsPage() {
  const [refillForecast, setRefillForecast] = useState<any[]>([]);
  const [consumptionTrend, setConsumptionTrend] = useState<any[]>([]);

  useEffect(() => {

    loadRefills();

  }, []);

  const loadRefills = async () => {

      try {

          const data = await getRefillStatus();

          console.log(data);

          setRefillForecast(data);

      }

      catch(error){

          console.error(error);

          toast.error("Unable to load refill data");

      }

  };
  const atRisk = refillForecast.filter(
    (r: any) => r.needs_refill
  );

  const nextRefill =
    refillForecast.length > 0
        ? refillForecast.reduce((a: any, b: any) =>
              new Date(a.refill_date) < new Date(b.refill_date) ? a : b
          )
        : null;

  return (
    <div className="space-y-6">
      <SectionHeading title="AI refill prediction" description="Consumption-based forecasting so no medicine runs out unnoticed." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Medicines tracked" value={String(refillForecast.length)} tone="primary" icon={<Package className="size-5" />} />
        <StatCard label="Low stock warnings" value={String(atRisk.length)} tone="warning" icon={<AlertTriangle className="size-5" />} />
        <StatCard
            label="Next refill date"
            value={nextRefill ? nextRefill.refill_date : "--"}
            tone="info"
            icon={<CalendarClock className="size-5" />}
            footer={
                <span>
                    {nextRefill?.medicine_name || "No medicines"}
                </span>
            }
        />
        <StatCard label="Forecast accuracy" value="96%" delta="AI model v2.4" tone="accent" icon={<Sparkles className="size-5" />} />
      </section>

      {atRisk.length > 0 && (
        <Card className="gap-0 rounded-2xl border-warning/40 bg-warning/10 p-5 shadow-soft">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">Low stock warning</p>
              <p className="truncate text-xs text-muted-foreground">
                {atRisk.map((r:any)=>r.medicine_name).join(", ")} will run out within 12 days at your current rate.
              </p>
            </div>
            <Button className="bg-brand-gradient shrink-0 rounded-full font-semibold" onClick={() => toast.success("Refill request sent to your pharmacy")}>
              Request refill
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Stock forecast" />
          <ul className="mt-4 space-y-3">
            {refillForecast.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border/70 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{r.medicine_name} · {r.dosage}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.medicine_name} units left · {r.days_left} days remaining
                    </p>
                  </div>
                  <StatusPill status={r.needs_refill === "high" ? "At risk" : "On track"} />
                </div>
                <Progress value={(r.remaining_quantity/r.total_quantity)*100} className="mt-3 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">Predicted refill date: <span className="font-semibold text-foreground">{r.refill_date}</span></p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="Consumption analytics" description="Units per month" />
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={refillForecast.map((m:any)=>({

                label:m.medicine_name,

                units:m.remaining_quantity

                }))}>
                  <defs>
                    <linearGradient id="refillFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="units" name="Units" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#refillFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
            <SectionHeading title="AI refill suggestions" />
            <ul className="mt-4 space-y-3">

            {refillForecast.map((r:any)=>(

            <li
            key={r.medicine_name}
            className="flex gap-3 rounded-xl bg-muted/50 p-3"
            >

            <Sparkles className="mt-1 size-4 text-accent"/>

            <div>

            <strong>{r.medicine_name}</strong>

            <p className="text-sm">

            {r.needs_refill

            ? `Only ${r.days_left} days left. Please refill before ${r.refill_date}.`

            : `You still have ${r.days_left} days of medicine remaining.`}

            </p>

            </div>

            </li>

            ))}

            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
