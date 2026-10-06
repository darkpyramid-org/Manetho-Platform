import * as React from "react";
import { cn } from "@/lib/utils";

/** Text input with a consistent obsidian surface. */
export function Input({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-md border border-ash bg-charcoal px-3",
        "text-sm text-papyrus placeholder:text-mist",
        "transition-colors focus:border-gold/60 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

/** Multi-line input. */
export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-md border border-ash",
        "bg-charcoal px-3 py-2 text-sm leading-relaxed text-papyrus",
        "placeholder:text-mist transition-colors",
        "focus:border-gold/60 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/** Form label, required indicator included. */
export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
}) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-sandstone",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ms-1 text-gold">
          *
        </span>
      ) : null}
    </label>
  );
}

/**
 * Native select styled to match the palette.
 * Native is deliberate: it is the most accessible and
 * best-supported control across platforms, including
 * mobile (spec §31 accessibility).
 */
export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-ash",
          "bg-charcoal pe-9 ps-3 text-sm text-papyrus",
          "focus:border-gold/60 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sandstone"
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}

/** File input styled as a drop target. */
export function FileInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="file"
      className={cn(
        "block w-full text-sm text-sandstone",
        "file:me-3 file:rounded-md file:border-0 file:bg-gold",
        "file:px-4 file:py-2 file:text-sm file:font-medium",
        "file:text-obsidian hover:file:bg-gold-bright",
        className,
      )}
      {...props}
    />
  );
}