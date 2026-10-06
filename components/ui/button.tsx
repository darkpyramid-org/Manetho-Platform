import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Button primitive (spec §30).
 * Variants map to the Manetho palette; every variant
 * keeps a visible focus ring for WCAG 2.2 AA.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-obsidian hover:bg-gold-bright active:bg-gold-deep font-medium shadow-stone",
  secondary:
    "bg-slate text-papyrus hover:bg-ash border border-ash hover:border-gold/40",
  ghost:
    "bg-transparent text-sandstone hover:bg-slate/70 hover:text-papyrus",
  outline:
    "bg-transparent border border-gold/45 text-gold hover:bg-gold/10 hover:border-gold",
  danger:
    "bg-danger/90 text-papyrus hover:bg-danger",
  link:
    "bg-transparent text-gold underline-offset-4 hover:underline p-0 h-auto",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render as the single child element (e.g. a <Link>). */
  asChild?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      // Buttons inside forms default to submit, which
      // causes accidental submissions; be explicit.
      {...(asChild ? {} : { type: type ?? "button" })}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "transition-colors duration-200",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

/** Square icon button with an accessible label requirement. */
export function IconButton({
  label,
  className,
  ...props
}: ButtonProps & { label: string }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={label}
      title={label}
      className={className}
      {...props}
    />
  );
}