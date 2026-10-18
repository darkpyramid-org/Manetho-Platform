import { aiProvider, isDemoMode } from "@/lib/features";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { apiError } from "@/lib/api/responses";

export type AIProviderName = "mock" | "openai" | "huawei" | "local";

const WEAK_SECRETS = new Set([
  "",
  "change-me-in-production",
  "changeme",
  "secret",
  "password",
]);

/**
 * Resolve which AI provider to use.
 * In production (NODE_ENV=production), the server AI_PROVIDER always wins —
 * client-supplied provider is ignored to prevent forcing paid backends.
 * In development, client override is allowed for local testing.
 */
export function resolveAiProvider(
  clientProvider?: AIProviderName,
): AIProviderName {
  const server = aiProvider();
  if (process.env.NODE_ENV === "production") {
    return server;
  }
  return clientProvider ?? server;
}

/**
 * Rate-limit AI routes. Defaults: 20 req / 15 min per IP.
 * Returns a Response when limited, otherwise null.
 */
export function enforceAiRateLimit(request: Request): Response | null {
  const ip = clientIp(request);
  const limit = Number(process.env.AI_RATE_LIMIT ?? "20");
  const windowMs = Number(process.env.AI_RATE_WINDOW_MS ?? String(15 * 60 * 1000));
  const result = rateLimit(`ai:${ip}`, limit, windowMs);
  if (!result.ok) {
    return apiError(
      "RATE_LIMITED",
      `Too many AI requests. Retry in ${result.retryAfterSec}s.`,
      429,
    );
  }
  return null;
}

/**
 * When a non-mock provider is active, require the matching API key
 * and warn when DEMO_MODE is still true in production.
 */
export function assertAiProviderConfigured(provider: AIProviderName): Response | null {
  if (provider === "mock" || provider === "local") return null;
  if (provider === "openai" && !process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    return apiError(
      "PROVIDER_NOT_CONFIGURED",
      "OpenAI provider selected but OPENAI_API_KEY is not set.",
      503,
    );
  }
  if (provider === "huawei" && !process.env.HUAWEI_API_KEY && !process.env.AI_API_KEY) {
    return apiError(
      "PROVIDER_NOT_CONFIGURED",
      "Huawei provider selected but HUAWEI_API_KEY is not set.",
      503,
    );
  }
  return null;
}

export function isWeakAuthSecret(secret: string | undefined): boolean {
  if (!secret) return true;
  return WEAK_SECRETS.has(secret.trim().toLowerCase());
}

export { isDemoMode };
