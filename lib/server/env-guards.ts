import { aiProvider, isDemoMode } from "@/lib/features";
import { isWeakAuthSecret } from "@/lib/api/ai-guards";

/**
 * Production environment guards (issues #2, #4).
 * Call from instrumentation or server entry. Throws in production
 * when critical misconfiguration would leave the app insecure.
 */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const authEnabled =
    process.env.AUTH_ENABLED === "true" ||
    Boolean(process.env.GOOGLE_CLIENT_ID) ||
    process.env.REQUIRE_AUTH === "true";

  if (authEnabled && isWeakAuthSecret(process.env.AUTH_SECRET)) {
    throw new Error(
      "[manetho] AUTH_SECRET is missing or still the example default. " +
        "Set a strong AUTH_SECRET before enabling auth in production.",
    );
  }

  const provider = aiProvider();
  if (provider === "openai" && !process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    throw new Error(
      "[manetho] AI_PROVIDER=openai requires OPENAI_API_KEY (or AI_API_KEY).",
    );
  }
  if (provider === "huawei" && !process.env.HUAWEI_API_KEY && !process.env.AI_API_KEY) {
    throw new Error(
      "[manetho] AI_PROVIDER=huawei requires HUAWEI_API_KEY (or AI_API_KEY).",
    );
  }

  if (provider !== "mock" && isDemoMode()) {
    console.warn(
      "[manetho] DEMO_MODE is true while AI_PROVIDER is not mock. " +
        "Set DEMO_MODE=false for production AI traffic.",
    );
  }
}
