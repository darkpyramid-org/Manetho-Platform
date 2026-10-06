/**
 * Deterministic SVG image generator for demo content.
 *
 * Manetho runs without any external image assets in
 * development: artifact thumbnails and museum covers are
 * generated as inline SVG data URIs using the design
 * system palette (obsidian, sandstone, gold).
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Motif glyphs used as decorative silhouettes. */
const MOTIFS = ["𓆣", "𓋺", "𓊹", "𓇳", "𓂀", "𓅃", "𓊵", "𓉐", "𓋾", "𓎛", "𓅓", "𓈖"];

function motifFor(seed: string): string {
  return MOTIFS[hash(seed) % MOTIFS.length];
}

export interface GeneratedImageOptions {
  /** Seed — usually the entity id. */
  seed: string;
  /** Short label rendered as a caption. */
  label?: string;
  /** Base hue name from the design palette. */
  accent?: "gold" | "nile" | "terracotta" | "fayum";
  width?: number;
  height?: number;
}

const ACCENTS = {
  gold: "#c9a227",
  nile: "#4b8a9c",
  terracotta: "#b4552d",
  fayum: "#7d9b76",
} as const;

/**
 * Build an SVG data URI. The result is safe to embed in
 * <img src> and CSS url() directly.
 */
export function generatedImage(options: GeneratedImageOptions): string {
  const {
    seed,
    label,
    accent = "gold",
    width = 800,
    height = 600,
  } = options;
  const accentColor = ACCENTS[accent];
  const motif = motifFor(seed);
  const seedNum = hash(seed);
  const variant = seedNum % 3;
  const rings = 2 + (seedNum % 3);

  let decorations = "";
  for (let i = 0; i < rings; i++) {
    const cx = 100 + ((seedNum * (i + 7)) % (width - 200));
    const cy = 80 + ((seedNum * (i + 13)) % (height - 160));
    const r = 60 + ((seedNum * (i + 3)) % 90);
    decorations += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accentColor}" stroke-opacity="0.08" stroke-width="1.5"/>`;
  }

  const labelText = label
    ? `<text x="${width / 2}" y="${height - 28}" fill="#c9b99b" fill-opacity="0.55" font-family="serif" font-size="22" text-anchor="middle" letter-spacing="4">${escapeXml(label.toUpperCase())}</text>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="80%">
      <stop offset="0%" stop-color="#16161e"/>
      <stop offset="55%" stop-color="#101016"/>
      <stop offset="100%" stop-color="#09090d"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.0"/>
      <stop offset="45%" stop-color="${accentColor}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${decorations}
  <rect width="100%" height="100%" fill="url(#sheen)"/>
  <path d="M0 ${height - 1} H ${width}" stroke="${accentColor}" stroke-opacity="0.35" stroke-width="1"/>
  <path d="M0 1 H ${width}" stroke="${accentColor}" stroke-opacity="0.18" stroke-width="1"/>
  <text x="${width / 2}" y="${height / 2 + (variant === 1 ? 60 : variant === 2 ? 40 : 90)}" font-size="${variant === 0 ? 190 : 150}" text-anchor="middle" fill="${accentColor}" fill-opacity="0.5" font-family="Segoe UI Historic, Noto Sans Egyptian Hieroglyphs, serif">${motif}</text>
  <text x="${width / 2}" y="${height / 2 + (variant === 0 ? 60 : variant === 1 ? 40 : 90)}" font-size="${variant === 2 ? 190 : 150}" text-anchor="middle" fill="#c9a227" fill-opacity="0.25" font-family="Segoe UI Historic, Noto Sans Egyptian Hieroglyphs, serif">${motif}</text>
  ${labelText}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Deterministic gallery cover for a museum. */
export function museumCover(museumSlug: string, name: string): string {
  return generatedImage({
    seed: `museum-${museumSlug}`,
    label: name,
    accent: "gold",
    width: 1200,
    height: 630,
  });
}

/** Deterministic artifact thumbnail. */
export function artifactImage(
  artifactSlug: string,
  name: string,
  accent: keyof typeof ACCENTS = "gold",
): string {
  return generatedImage({
    seed: `artifact-${artifactSlug}`,
    label: name,
    accent,
    width: 800,
    height: 800,
  });
}

/**
 * Synthetic inscription image (spec §23).
 *
 * Draws a row of real hieroglyphs on a stone ground so the
 * translator demo has something honest to read. These are
 * generated images, not photographs of real inscriptions,
 * and the UI labels them as samples.
 *
 * The SVG carries a `data-signs` attribute listing the
 * Gardiner codes it depicts. The deterministic demo vision
 * provider reads that attribute so a sample and its reading
 * always agree; real photographs have no such attribute and
 * fall back to content hashing.
 */
export function inscriptionSampleImage(options: {
  signIds: string[];
  glyphs: string[];
  label: string;
  width?: number;
  height?: number;
}): string {
  const {
    signIds,
    glyphs,
    label,
    width = 1200,
    height = 700,
  } = options;

  const padding = 90;
  const cell = (width - padding * 2) / Math.max(glyphs.length, 1);
  const glyphSize = Math.min(cell * 0.62, 190);
  const baseline = height * 0.55;

  const drawn = glyphs
    .map((glyph, index) => {
      const cx = padding + cell * index + cell / 2;
      return `<text x="${cx.toFixed(1)}" y="${baseline.toFixed(1)}" font-size="${glyphSize.toFixed(
        0,
      )}" text-anchor="middle" fill="#1a1207" font-family="Segoe UI Historic, Noto Sans Egyptian Hieroglyphs, Aegean, serif">${glyph}</text>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-signs="${escapeXml(
    signIds.join(","),
  )}">
  <defs>
    <linearGradient id="stone" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#d9c9a8"/>
      <stop offset="45%" stop-color="#c6b28c"/>
      <stop offset="100%" stop-color="#a8906a"/>
    </linearGradient>
    <filter id="rough">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#stone)"/>
  <g opacity="0.14" filter="url(#rough)">
    ${Array.from({ length: 40 })
      .map((_, i) => {
        const x = ((i * 137) % width);
        const y = ((i * 271) % height);
        const r = 18 + ((i * 53) % 70);
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="#6b5636" fill-opacity="0.5"/>`;
      })
      .join("")}
  </g>
  <rect x="${padding * 0.45}" y="${baseline - glyphSize * 0.78}" width="${
    width - padding * 0.9
  }" height="${glyphSize * 1.05}" fill="none" stroke="#7a6440" stroke-opacity="0.35" stroke-width="2"/>
  <g filter="url(#rough)">${drawn}</g>
  <text x="${width / 2}" y="${height - 34}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="20" fill="#5b4a30" fill-opacity="0.7" letter-spacing="3">${escapeXml(
    label.toUpperCase(),
  )}</text>
  <text x="${width / 2}" y="${height - 12}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#5b4a30" fill-opacity="0.55">SYNTHETIC SAMPLE IMAGE · NOT A PHOTOGRAPH OF A REAL INSCRIPTION</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
