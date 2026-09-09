import { createFileRoute, Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/verzending")({
  head: () => ({
    meta: [
      { title: "Verzending & levering — Besjaar" },
      {
        name: "description",
        content:
          "Levertijden en verzendkosten van Besjaar voor Nederland, België en Duitsland, inclusief track & trace.",
      },
      { property: "og:title", content: "Verzending & levering — Besjaar" },
      {
        property: "og:description",
        content: "Verzending, levertijden en retourvoorwaarden van Besjaar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const { t } = useI18n();

  const zones = [
    {
      key: "nl",
      country: t("shipping.nl"),
      time: t("shipping.nlTime"),
      cost: t("shipping.nlCost"),
    },
    { key: "be", country: t("shipping.be"), time: t("shipping.beTime"), cost: "€ 6,95" },
    { key: "de", country: t("shipping.de"), time: t("shipping.deTime"), cost: "€ 7,95" },
  ];

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("shipping.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("shipping.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("shipping.intro")}</p>

        <div className="mt-8 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="p-3 font-semibold">{t("shipping.thCountry")}</th>
                <th className="p-3 font-semibold">{t("shipping.thTime")}</th>
                <th className="p-3 font-semibold">{t("shipping.thCost")}</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.key} className="border-t">
                  <td className="p-3 font-medium">{zone.country}</td>
                  <td className="p-3 text-muted-foreground">{zone.time}</td>
                  <td className="p-3 text-muted-foreground">{zone.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">{t("shipping.trackLabel")}</span>
            {t("shipping.trackTextPrefix")}
            <Link
              to="/account"
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {t("shipping.trackLink")}
            </Link>
            .
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("shipping.notHomeLabel")}</span>
            {t("shipping.notHomeText")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("shipping.returnLabel")}</span>
            {t("shipping.returnTextPrefix")}
            <Link
              to="/retouren"
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {t("shipping.returnLink")}
            </Link>
            {t("shipping.returnTextSuffix")}
          </p>
        </div>
      </div>
    </div>
  );
}
