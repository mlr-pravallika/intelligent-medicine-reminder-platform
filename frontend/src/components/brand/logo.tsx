import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  to = "/",
}: {
  className?: string;
  showText?: boolean;
  to?: string;
}) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5", className)} aria-label="MediCare AI home">
      <span className="bg-brand-gradient grid size-9 shrink-0 place-items-center rounded-xl shadow-glow">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none">
          <path
            d="M12 4v16M4 12h16"
            stroke="currentColor"
            className="text-primary-foreground"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText && (
        <span className="min-w-0">
          <span className="block truncate text-base font-extrabold tracking-tight text-foreground">
            MediCare<span className="text-accent"> AI</span>
          </span>
          <span className="block truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Medication Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}
