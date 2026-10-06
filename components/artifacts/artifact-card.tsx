import Image from "next/image";
import type { Artifact } from "@/types/museum";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Object card used on the home, museum and discovery pages. */
export function ArtifactCard({
  artifact,
  museumName,
  className,
  priority = false,
}: {
  artifact: Artifact;
  museumName?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Card
      className={cn(
        "h-full overflow-hidden transition-colors hover:border-gold/40",
        className,
      )}
    >
      <Link
        href={`/artifact/${artifact.slug}`}
        className="flex h-full flex-col focus-visible:outline-none"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-obsidian">
          <Image
            src={artifact.images[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            unoptimized
            priority={priority}
          />
          {artifact.featured ? (
            <span className="absolute start-3 top-3">
              <Badge tone="gold" className="bg-obsidian/85 backdrop-blur-sm">
                <span aria-hidden="true">✦</span>
              </Badge>
            </span>
          ) : null}
        </div>

        <CardContent className="flex flex-1 flex-col p-4">
          <p className="text-[0.7rem] uppercase tracking-wider text-gold">
            {artifact.period}
          </p>
          <h3 className="mt-1.5 font-display text-base leading-snug text-papyrus">
            {artifact.name}
          </h3>
          <p className="mt-1 text-xs text-sandstone/70">
            {artifact.dynasty}
            {museumName ? ` · ${museumName}` : ""}
          </p>
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-sandstone/70">
            {artifact.description}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}

/** Compact horizontal variant for lists and sidebars. */
export function ArtifactRow({
  artifact,
  className,
}: {
  artifact: Artifact;
  className?: string;
}) {
  return (
    <Link
      href={`/artifact/${artifact.slug}`}
      className={cn(
        "group flex items-center gap-3 rounded-md p-2",
        "transition-colors hover:bg-slate/60 focus-visible:outline-none",
        className,
      )}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-obsidian">
        <Image
          src={artifact.images[0]}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-papyrus group-hover:text-gold-bright">
          {artifact.name}
        </span>
        <span className="block truncate text-xs text-sandstone/60">
          {artifact.period} · {artifact.inventoryNumber}
        </span>
      </span>
    </Link>
  );
}

/** Grid of object cards. */
export function ArtifactGrid({
  artifacts,
  museumNames,
  emptyLabel,
}: {
  artifacts: Artifact[];
  museumNames?: Record<string, string>;
  emptyLabel?: string;
}) {
  if (artifacts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-ash p-8 text-center text-sm text-sandstone/70">
        {emptyLabel ?? "No objects"}
      </p>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {artifacts.map((artifact) => (
        <li key={artifact.id}>
          <ArtifactCard
            artifact={artifact}
            museumName={
              museumNames ? museumNames[artifact.museumId] : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}