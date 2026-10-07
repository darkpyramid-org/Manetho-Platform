import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Glyph } from "@/components/hieroglyph/sign-display";
import { getSession, can } from "@/lib/auth/session";
import { hieroglyphRepository } from "@/lib/data";
import { routing, type Locale } from "@/i18n.config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Sign database management (spec §47). */
export default async function AdminHieroglyphsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const td = await getTranslations({ locale, namespace: "discover" });
  const session = await getSession();

  if (!can(session, "content:write")) {
    return (
      <Card className="border-warning/40">
        <CardContent className="p-5">
          <p className="text-sm text-sandstone">
            {t("roleRequired")}{" "}
            {t("roleRequiredBody", { role: "MUSEUM_EDITOR" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const signs = hieroglyphRepository.list();
  const byType = signs.reduce<Record<string, number>>((acc, sign) => {
    acc[sign.signType] = (acc[sign.signType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section aria-labelledby="signs-title">
      <AdminSectionHeader
        title={t("nav.hieroglyphs")}
        count={signs.length}
        description={t("hieroglyphsDescription")}
      />

      {/* Composition at a glance */}
      <ul className="mb-6 flex flex-wrap gap-2">
        {Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <li key={type}>
              <Badge tone="neutral">
                {type} · {count}
              </Badge>
            </li>
          ))}
      </ul>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {signs.map((sign) => (
          <li key={sign.id}>
            <div className="flex h-full items-start gap-3 rounded-md border border-ash/60 bg-charcoal p-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded border border-gold/20 bg-obsidian">
                <Glyph glyph={sign.glyph} label={sign.name} size="md" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-papyrus">
                  {sign.name}
                </span>
                <span className="mt-0.5 block font-mono text-[0.7rem] text-gold">
                  {sign.gardinerCode} · {sign.unicode}
                </span>
                <span className="mt-1 block text-xs text-sandstone/65">
                  {sign.signType}
                  {sign.phoneticValues.length > 0
                    ? ` · ${sign.phoneticValues.join(" / ")}`
                    : ""}
                </span>
                <span className="mt-1 block truncate text-[0.7rem] text-sandstone/45">
                  {td("category")}: {sign.category} · {sign.era}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}