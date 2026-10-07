/**
 * Server-safe admin heading (spec §47).
 *
 * Kept apart from admin-nav.tsx so server components can use
 * the heading without pulling the navigation's client boundary
 * across the whole admin section.
 */
export function AdminSectionHeader({
  title,
  count,
  description,
}: {
  title: string;
  count?: number;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-xl text-papyrus">
        {title}
        {count !== undefined ? (
          <span className="ms-2 text-sm font-normal tabular-nums text-sandstone/60">
            {count}
          </span>
        ) : null}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-sandstone/75">{description}</p>
      ) : null}
    </div>
  );
}