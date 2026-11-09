import { cn } from "@/lib/utils";

/** MAVAI logo mark: an eye-shaped memory node. */
export function MavaiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("text-foreground", className)}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M5 16c3-5.5 7-8 11-8s8 2.5 11 8c-3 5.5-7 8-11 8s-8-2.5-11-8Z"
        fill="none"
        stroke="var(--background)"
        strokeWidth="2"
      />
      <circle cx="16" cy="16" r="3.6" fill="var(--accent)" />
    </svg>
  );
}
