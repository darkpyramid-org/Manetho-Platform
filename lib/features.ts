/**
 * Feature flags (spec §69).
 * Every flag can be toggled through the environment so the product
 * deploys with different feature combinations.
 */
function flag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

export const features = {
  translator: flag("ENABLE_TRANSLATOR", true),
  aiAssistant: flag("ENABLE_AI_ASSISTANT", true),
  voice: flag("ENABLE_VOICE", true),
  museumMap: flag("ENABLE_MUSEUM_MAP", true),
  ar: flag("ENABLE_AR", false),
  vr: flag("ENABLE_VR", false),
  learning: flag("ENABLE_LEARNING", true),
  researchMode: flag("ENABLE_RESEARCH_MODE", true),
  offlineMode: flag("ENABLE_OFFLINE_MODE", true),
} as const;

export type FeatureKey = keyof typeof features;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return features[key] ?? false;
}

/** Demo mode: deterministic Mock AI provider, clearly labelled in the UI. */
export function isDemoMode(): boolean {
  return (process.env.DEMO_MODE ?? "true") !== "false";
}

/** Active AI provider: mock | openai | huawei | local */
export function aiProvider(): "mock" | "openai" | "huawei" | "local" {
  const raw = process.env.AI_PROVIDER ?? "mock";
  if (raw === "openai" || raw === "huawei" || raw === "local") return raw;
  return "mock";
}
