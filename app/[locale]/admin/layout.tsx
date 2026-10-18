import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { getSession, can } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/admin-nav";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Admin section (spec §47).
 *
 * The shell renders for every visitor, but each page checks
 * the capability it needs. Guest mode has no elevated roles,
 * so the honest outcome here is a clear "no permission"
 * screen rather than an empty dashboard.
 *
 * When REQUIRE_AUTH/AUTH_ENABLED is true in production, guests
 * cannot open admin; elevate via DEMO_ADMIN_SECRET or a real IdP.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const session = await getSession();
  const allowed = can(session, "content:read");
  const canWrite = can(session, "content:write");
  const productionAuth =
    process.env.NODE_ENV === "production" &&
    (process.env.REQUIRE_AUTH === "true" || process.env.AUTH_ENABLED === "true");
  const adminAllowed = productionAuth ? canWrite : allowed;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-papyrus sm:text-4xl">
            {t("title")}
          </h1>
          <Badge tone={canWrite ? "gold" : "neutral"}>
            {session.role}
          </Badge>
        </div>
        <p className="mt-3 max-w-2xl text-sandstone">{t("subtitle")}</p>
      </header>

      <AdminNav />

      {!adminAllowed ? (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              {t("roleRequired")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-sandstone">
              {t("roleRequiredBody", { role: "MUSEUM_EDITOR" })}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {adminAllowed ? children : null}
    </div>
  );
}
