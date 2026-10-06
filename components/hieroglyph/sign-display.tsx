import type { HieroglyphSign } from "@/types/hieroglyph";
import { cn } from "@/lib/utils";

/**
 * Hieroglyph glyph (spec §20).
 *
 * Rendered from the Unicode code point, so it needs no image
 * asset and stays crisp at any size. Screen readers receive a
 * text description instead of the glyph, which they cannot
 * pronounce meaningfully (WCAG 2.2).
 */
export function Glyph({
  glyph,
  label,
  className,
  size = "md",
}: {
  glyph: string;
  /** Accessible name — the sign's English name. */
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
  } as const;

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "hiero inline-block leading-none text-gold",
        sizes[size],
        className,
      )}
    >
      <span aria-hidden="true">{glyph}</span>
    </span>
  );
}

/** Full sign record rendered as a card. */
export function SignCard({
  sign,
  className,
}: {
  sign: HieroglyphSign;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ash/70 bg-charcoal p-4",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-gold/25 bg-obsidian">
          <Glyph glyph={sign.glyph} label={sign.name} size="lg" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base text-papyrus">
            {sign.name}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-gold">
            {sign.gardinerCode} · {sign.unicode}
          </p>
          <p className="mt-1.5 text-xs uppercase tracking-wide text-sandstone/70">
            {sign.signType}
            {sign.phoneticValues.length > 0
              ? ` · ${sign.phoneticValues.join(" / ")}`
              : ""}
          </p>
        </div>
      </div>

      {sign.ideographicMeaning ? (
        <p className="mt-3 text-sm text-papyrus">
          <span className="text-sandstone/70">Meaning: </span>
          {sign.ideographicMeaning}
        </p>
      ) : null}

      <p className="mt-3 text-sm leading-relaxed text-sandstone/85">
        {sign.description}
      </p>

      {sign.sources.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-ash/60 pt-3">
          {sign.sources.map((source) => (
            <li
              key={source.id}
              className="text-[0.7rem] leading-relaxed text-sandstone/55"
            >
              {source.citationText}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * A row of glyphs, used for transliterations and for the
 * sign strip in the translator.
 */
export function GlyphRow({
  glyphs,
  className,
  labels,
}: {
  glyphs: string[];
  className?: string;
  labels?: string[];
}) {
  if (glyphs.length === 0) return null;
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 gap-y-2",
        className,
      )}
    >
      {glyphs.map((glyph, index) => (
        <Glyph
          key={`${glyph}-${index}`}
          glyph={glyph}
          label={labels?.[index] ?? glyph}
          size="md"
        />
      ))}
    </p>
  );
}