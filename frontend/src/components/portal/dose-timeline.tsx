import { Check, Clock, SkipForward, TimerReset, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/portal/stat-card";

interface Dose {

    id:number;

    medicine_name:string;

    dosage:string;

    reminder_time:string;

    status:string;

    instruction: string;

}

const icons = {
  completed: Check,
  upcoming: Clock,
  missed: X,
  skipped: SkipForward,
  snoozed: TimerReset,
};

const tones = {
  completed: "bg-accent text-accent-foreground",
  upcoming: "bg-primary text-primary-foreground",
  missed: "bg-destructive text-destructive-foreground",
  skipped: "bg-muted text-muted-foreground",
  snoozed: "bg-warning text-warning-foreground",
};

export function DoseTimeline({ doses }: { doses: Dose[] }) {
  if (!doses || doses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
        No medicines for today.
      </div>
    );
  }

  return (
    <ol className="relative space-y-1">
      <span
        className="absolute left-[19px] top-3 bottom-3 w-px bg-border"
        aria-hidden="true"
      />

      {doses.map((dose) => {
        const Icon = icons[dose.status as keyof typeof icons] ?? Clock;

        return (
          <li
            key={dose.id}
            className="relative flex gap-4 rounded-2xl p-2.5 hover:bg-muted/60"
          >
            <span
              className={cn(
                "z-10 mt-0.5 grid size-10 place-items-center rounded-full ring-4 ring-card",
                tones[dose.status as keyof typeof tones] ??
                "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>

            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-3">
              <div>
                <p className="font-bold">
                    {dose.medicine_name}
                </p>

                <p>
                    {dose.dosage}
                </p>

                <p>
                    Reminder :
                    {dose.reminder_time}
                </p>
              </div>

              <StatusPill status={dose.status} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}