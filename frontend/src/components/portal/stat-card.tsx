import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  delta,
  tone = "primary",
  icon,
  footer,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "primary" | "accent" | "warning" | "destructive" | "info";
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const toneRing: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/12 text-destructive",
    info: "bg-info/15 text-info",
  };

  return (
    <Card className={cn("gap-0 rounded-2xl border-border/70 p-5 shadow-soft", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        </div>
        {icon && (
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneRing[tone])}>
            {icon}
          </span>
        )}
      </div>
      {(delta || footer) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {delta && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
              {delta}
            </span>
          )}
          {footer}
        </div>
      )}
    </Card>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
      {icon && <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">{icon}</span>}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Active: "bg-accent-soft text-accent",
  inactive: "bg-destructive/10 text-destructive",
  Paused: "bg-warning/15 text-warning",
  Completed: "bg-primary-soft text-primary",
  Expired: "bg-destructive/12 text-destructive",
  completed: "bg-accent-soft text-accent",
  upcoming: "bg-primary-soft text-primary",
  missed: "bg-destructive/12 text-destructive",
  skipped: "bg-muted text-muted-foreground",
  snoozed: "bg-warning/15 text-warning",
  Critical: "bg-destructive/12 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-primary-soft text-primary",
  "On track": "bg-accent-soft text-accent",
  "At risk": "bg-warning/15 text-warning",
  Operational: "bg-accent-soft text-accent",
  Degraded: "bg-warning/15 text-warning",
  Suspended: "bg-destructive/12 text-destructive",
  Invited: "bg-primary-soft text-primary",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
