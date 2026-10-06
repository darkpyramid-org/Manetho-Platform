import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Card surface (spec §31).
 * The obsidian surface with a gold hairline is the
 * primary content container across the product.
 */
export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-ash/70 bg-charcoal",
        "shadow-stone transition-colors duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-b border-ash/60 p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-lg leading-snug text-papyrus",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-sandstone/85", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props} />
  );
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-ash/60 p-5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Panel with a decorative gold hairline at the top —
 * used for featured content and section headers.
 */
export function FeatureCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={cn("group overflow-hidden", className)} {...props}>
      <span
        aria-hidden="true"
        className="gold-line absolute inset-x-0 top-0 opacity-70"
      />
      {children}
    </Card>
  );
}