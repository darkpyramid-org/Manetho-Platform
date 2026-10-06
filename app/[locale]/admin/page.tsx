import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  BarChart3,
  BookOpen,
  Landmark,
  Layers,
  Route,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession, can, roleSummaries } from "@/lib/auth/session";
import { aiProvider, isDemoMode } from "@/lib/features";
import {
  artifacts,
  courses,
  hieroglyphSigns,
  museums,
  tours,
} from "@/lib/data";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

/** Admin overview (spec §47). */
export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const session = await getSession();

  const lessonCount = courses.reduce(
    (total, course) => total + course.lessons.length,
    0,
  );

  const stats = [
    {
      label: t("totalArtifacts"),
      value: artifacts.length,
      icon: Landmark,
    },
    { label: t("totalSigns"), value: hieroglyphSigns.length, icon: Layers },
    { label: t("totalMuseums"), value: museums.length, icon: BookOpen },
    { label: t("nav.lessons"), value: lessonCount, icon: Route },
    {
      label: t("nav.tours"),
      value: tours.length,
      icon: Route,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Platform statistics */}
      <section aria-labelledby="overview-title">
        <h2
          id="overview-title"
          className="flex items-center gap-2 font-display text-xl text-papyrus"
        >
          <BarChart3 className="h-5 w-5 text-gold" aria-hidden="true" />
          {t("overviewTitle")}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Card>
                <CardContent className="p-4">
                  <stat.icon
                    className="h-4 w-4 text-gold"
                    aria-hidden="true"
                  />
                  <p className="mt-3 font-display text-2xl text-papyrus tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-sandstone/60">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Deployment configuration */}
      <section aria-labelledby="config-title">
        <h2
          id="config-title"
          className="flex items-center gap-2 font-display text-xl text-papyrus"
        >
          <Sparkles className="h-5 w-5 text-gold" aria-hidden="true" />
          AI provider
        </h2>
        <Card className="mt-4">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={aiProvider() === "mock" ? "warning" : "success"}>
                {aiProvider()}
              </Badge>
              {isDemoMode() ? <Badge tone="warning">DEMO MODE</Badge> : null}
            </div>
            <p className="text-sm leading-relaxed text-sandstone">
              {aiProvider() === "mock"
                ? "The deterministic Mock provider is active. Recognition results and assistant answers are clearly labelled as demo output and must not be cited."
                : `The ${aiProvider()} provider is active. Results are Zod-validated before they reach the application.`}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Roles and permissions */}
      <section aria-labelledby="roles-title">
        <h2
          id="roles-title"
          className="flex items-center gap-2 font-display text-xl text-papyrus"
        >
          <Users className="h-5 w-5 text-gold" aria-hidden="true" />
          Roles
        </h2>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              Current session: {session.role}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-start text-sm">
                <caption className="sr-only">
                  Roles and their permissions
                </caption>
                <thead>
                  <tr className="border-b border-ash/60 text-start text-xs uppercase tracking-wide text-sandstone/60">
                    <th scope="col" className="py-2 pe-4 text-start">
                      Role
                    </th>
                    <th scope="col" className="py-2 text-start">
                      Permissions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleSummaries().map((entry) => (
                    <tr
                      key={entry.role}
                      className="border-b border-ash/30 last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-2.5 pe-4 text-start font-mono text-xs text-papyrus"
                      >
                        {entry.role}
                        {entry.role === session.role ? (
                          <span className="ms-2 text-gold">←</span>
                        ) : null}
                      </th>
                      <td className="py-2.5">
                        <span className="flex flex-wrap gap-1">
                          {entry.permissions.map((permission) => (
                            <Badge key={permission} tone="neutral">
                              {permission}
                            </Badge>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-sandstone/60">
              Guest mode grants only the USER role, which holds
              read-only access. Editing requires a role granted by
              an administrator in a deployment with an identity
              provider configured.
            </p>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-sandstone/50">
        {can(session, "content:write")
          ? "You have content editing permissions."
          : "Read-only access."}
      </p>
    </div>
  );
}