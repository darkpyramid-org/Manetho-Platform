import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Tabs ────────────────────────────────────────────────── */

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg",
        "border border-ash/70 bg-charcoal p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-md px-3.5 py-1.5 text-sm text-sandstone",
        "transition-colors hover:text-papyrus",
        "data-[state=active]:bg-gold data-[state=active]:text-obsidian",
        "data-[state=active]:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-5 focus-visible:outline-none", className)}
      {...props}
    />
  );
}

/* ── Dialog ──────────────────────────────────────────────── */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed start-1/2 top-1/2 z-50 w-[min(94vw,38rem)] -translate-y-1/2",
          "max-h-[88dvh] overflow-y-auto rounded-xl border border-ash",
          "bg-charcoal p-6 shadow-stone",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute end-4 top-4 rounded-md p-1 text-sandstone",
            "transition-colors hover:bg-slate hover:text-papyrus",
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-display text-xl text-papyrus pe-8",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1.5 text-sm text-sandstone/85", className)}
      {...props}
    />
  );
}

/* ── Tooltip ─────────────────────────────────────────────── */

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={6}
        className={cn(
          "z-50 max-w-xs rounded-md border border-ash bg-slate",
          "px-3 py-2 text-xs leading-relaxed text-papyrus shadow-stone",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

/* ── Switch ──────────────────────────────────────────────── */

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer",
        "items-center rounded-full border border-ash transition-colors",
        "data-[state=checked]:border-gold data-[state=checked]:bg-gold/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-sandstone",
          "transition-transform data-[state=checked]:translate-x-5",
          "data-[state=checked]:bg-gold rtl:data-[state=checked]:-translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

/* ── Skeleton / Spinner / Progress ───────────────────────── */

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-slate/80",
        className,
      )}
      {...props}
    />
  );
}

/** Accessible loading spinner. */
export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full",
        "border-2 border-ash border-t-gold",
        className,
      )}
    />
  );
}

/**
 * Confidence meter. The numeric value is always shown
 * as text next to the bar, so the bar is decorative
 * reinforcement rather than the only signal.
 */
export function ConfidenceMeter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const tone =
    pct >= 75
      ? "bg-success"
      : pct >= 55
        ? "bg-gold"
        : "bg-danger";
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence ${pct}%`}
    >
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-end text-xs tabular-nums text-sandstone">
        {pct}%
      </span>
    </div>
  );
}