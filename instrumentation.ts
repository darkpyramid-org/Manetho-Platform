export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnv } = await import("@/lib/server/env-guards");
    try {
      assertProductionEnv();
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes("[manetho]")) {
        throw err;
      }
    }
  }
}
